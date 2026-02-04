"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  countQueuedEvents,
  enqueueEvent,
  listQueuedEvents,
  removeQueuedEvent,
} from "@/lib/offline-queue";
import {
  cacheEmployees,
  getAllCachedEmployees,
  getCacheVersion,
  getFromMemoryCache,
  isCacheValid,
  lookupEmployeeByBadge,
  setMemoryCache,
} from "@/lib/employee-cache";
import { CheckIcon, AlertIcon } from "@/components/ui/icons";

type Props = {
  deviceId: string;
  siteId: string;
};

type ClockEventPayload = {
  employeeId: string;
  siteId: string;
  deviceId: string;
  type: "IN" | "OUT" | "BREAK_START" | "BREAK_END";
  source: "KIOSK" | "OFFLINE_SYNC";
  occurredAt: string;
  idempotencyKey: string;
};

const punchTypes: ClockEventPayload["type"][] = [
  "IN",
  "OUT",
  "BREAK_START",
  "BREAK_END",
];

const idleMs = 30_000;
const handshakeMinIntervalMs = 2_000;
const handshakeMaxBackoffMs = 30_000;

export default function KioskTerminal({ deviceId, siteId }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const idleTimer = useRef<NodeJS.Timeout | null>(null);
  const [online, setOnline] = useState(true);
  const [queuedCount, setQueuedCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [handshake, setHandshake] = useState<"pending" | "ok" | "error">(
    "pending",
  );
  const [offlineReady, setOfflineReady] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [badgeId, setBadgeId] = useState("");
  const [selectedType, setSelectedType] =
    useState<ClockEventPayload["type"]>("IN");
  const [status, setStatus] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const handshakeInFlight = useRef(false);
  const handshakeTimer = useRef<NodeJS.Timeout | null>(null);
  const handshakeAttempts = useRef(0);
  const lastHandshakeAt = useRef<number | null>(null);

  const resetIdle = useCallback(() => {
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
    }
    idleTimer.current = setTimeout(() => {
      router.push("/kiosk/ready");
    }, idleMs);
  }, [router]);

  const updateQueuedCount = useCallback(async () => {
    const count = await countQueuedEvents();
    setQueuedCount(count);
  }, []);

  const beep = useCallback((type: "success" | "error") => {
    try {
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.value = type === "success" ? 880 : 220;
      oscillator.connect(ctx.destination);
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        ctx.close();
      }, 120);
    } catch {
      // ignore audio errors
    }
  }, []);

  const syncQueue = useCallback(async () => {
    if (!navigator.onLine || syncing) {
      return;
    }
    setSyncing(true);
    try {
      const queued = await listQueuedEvents();
      for (const record of queued) {
        const response = await fetch("/api/kiosk/clock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(record.payload),
        });

        if (response.ok) {
          await removeQueuedEvent(record.idempotencyKey);
        }
      }
      setLastSync(new Date().toLocaleTimeString());
    } finally {
      await updateQueuedCount();
      setSyncing(false);
    }
  }, [syncing, updateQueuedCount]);

  // Warm start: Try to hydrate from IDB immediately on mount
  useEffect(() => {
    const warmStart = async () => {
      try {
        // Fast check for valid cache
        const valid = await isCacheValid();
        if (valid) {
          const employees = await getAllCachedEmployees();
          if (employees.length > 0) {
            setMemoryCache(employees);
            setOfflineReady(true);
          }
        }
      } catch {
        // Ignore warm start errors, handshake will handle it
      }
    };
    warmStart();
  }, []);

  useEffect(() => {
    let cancelled = false;

    setOnline(navigator.onLine);
    updateQueuedCount();

    const scheduleHandshakeRetry = (message: string) => {
      if (cancelled) return;
      const attempt = handshakeAttempts.current;
      const nextDelay = Math.min(
        handshakeMaxBackoffMs,
        handshakeMinIntervalMs * 2 ** attempt,
      );
      handshakeAttempts.current = attempt + 1;
      setStatus(message);
      if (handshakeTimer.current) {
        clearTimeout(handshakeTimer.current);
      }
      handshakeTimer.current = setTimeout(() => {
        if (!cancelled) {
          runHandshake();
        }
      }, nextDelay);
    };

    const runHandshake = async () => {
      if (handshakeInFlight.current) {
        return;
      }
      const now = Date.now();
      if (
        lastHandshakeAt.current &&
        now - lastHandshakeAt.current < handshakeMinIntervalMs
      ) {
        return;
      }
      lastHandshakeAt.current = now;
      handshakeInFlight.current = true;
      try {
        if (!navigator.onLine) {
          setHandshake("error");
          scheduleHandshakeRetry("Offline. Waiting for connection.");
          return;
        }

        // Get cache version with timeout to prevent blocking
        let employeesVersion: string | null = null;
        try {
          const versionPromise = getCacheVersion();
          const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1000));
          employeesVersion = await Promise.race([versionPromise, timeoutPromise]);
        } catch {
          // Ignore cache version errors
        }

        const response = await fetch("/api/kiosk/handshake", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deviceId,
            siteId,
            employeesVersion,
          }),
        });
        if (response.ok) {
          const data = await response.json();

          if (data.employees && data.employeesVersion) {
            // 1. Immediately update in-memory cache and state
            setMemoryCache(data.employees);
            setOfflineReady(true);

            // 2. Persist to IDB in background (fire-and-forget)
            cacheEmployees(data.employees, data.employeesVersion).catch(() => {
              // Ignore persistence errors
            });
          }

          handshakeAttempts.current = 0;
          setHandshake("ok");
          setStatus(null);
          return;
        }

        setHandshake("error");
        if (response.status === 403) {
          setStatus("Device not registered. Contact admin.");
          return;
        }

        scheduleHandshakeRetry("Handshake failed. Retrying...");
      } catch {
        setHandshake("error");
        scheduleHandshakeRetry("Handshake failed. Retrying...");
      } finally {
        handshakeInFlight.current = false;
      }
    };

    runHandshake();
    syncQueue();
    resetIdle();

    const handleOnline = () => {
      setOnline(true);
      syncQueue();
      runHandshake();
    };
    const handleOffline = () => setOnline(false);
    const handleInteraction = () => resetIdle();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("keydown", handleInteraction);
    window.addEventListener("mousemove", handleInteraction);

    return () => {
      cancelled = true;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("keydown", handleInteraction);
      window.removeEventListener("mousemove", handleInteraction);
      if (idleTimer.current) {
        clearTimeout(idleTimer.current);
      }
      if (handshakeTimer.current) {
        clearTimeout(handshakeTimer.current);
      }
    };
  }, [deviceId, siteId, resetIdle, syncQueue, updateQueuedCount]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [badgeId, success]);

  const resolveEmployee = async (): Promise<{ employeeId: string; employeeName: string }> => {
    const memoryCached = getFromMemoryCache(badgeId);
    if (memoryCached) {
      return { employeeId: memoryCached.employeeId, employeeName: memoryCached.displayName };
    }

    try {
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 500));
      const idbCached = await Promise.race([lookupEmployeeByBadge(badgeId), timeoutPromise]);
      if (idbCached) {
        return { employeeId: idbCached.employeeId, employeeName: idbCached.displayName };
      }
    } catch {
      // Ignore IDB errors
    }

    if (navigator.onLine) {
      const response = await fetch("/api/kiosk/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ badgeId }),
      });
      if (response.ok) {
        return response.json() as Promise<{ employeeId: string; employeeName: string }>;
      }
    }

    if (!navigator.onLine) {
      throw new Error("employee_not_found_offline");
    }
    throw new Error("employee_not_found");
  };

  const sendPunch = async () => {
    if (!badgeId) {
      setStatus("Scan or enter a badge ID to continue.");
      beep("error");
      return;
    }

    try {
      const { employeeId, employeeName } = await resolveEmployee();

      const idempotencyKey = crypto.randomUUID();
      const payload: ClockEventPayload = {
        employeeId,
        siteId,
        deviceId,
        type: selectedType,
        source: online ? "KIOSK" : "OFFLINE_SYNC",
        occurredAt: new Date().toISOString(),
        idempotencyKey,
      };

      if (!online) {
        await enqueueEvent(payload, idempotencyKey);
        await updateQueuedCount();
        setStatus(`Saved offline for ${employeeName}.`);
        setBadgeId("");
        return;
      }

      const response = await fetch("/api/kiosk/clock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        await enqueueEvent(payload, idempotencyKey);
        await updateQueuedCount();
        setStatus("Network issue. Saved offline for retry.");
        beep("error");
        return;
      }

      setSuccess(true);
      setStatus(`${employeeName} • ${selectedType.replace("_", " ")} saved`);
      setLastSync(new Date().toLocaleTimeString());
      beep("success");
      setBadgeId("");
      setTimeout(() => setSuccess(false), 2000);
    } catch (error) {
      if (error instanceof Error && error.message === "employee_not_found_offline") {
        setStatus("Employee not found. Check badge ID.");
        beep("error");
      } else {
        setStatus("Employee not found. Check badge ID.");
        beep("error");
      }
    }
  };

  const handshakeBadge = useMemo(() => {
    if (handshake === "ok") return "success";
    if (handshake === "error") return "danger";
    return "warning";
  }, [handshake]);

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">
              Wymap Kiosk
            </p>
            <h1 className="text-3xl font-semibold">Punch Terminal</h1>
            <p className="text-sm text-[var(--text-muted)]">
              Device {deviceId} • Site {siteId}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge data-testid="handshake-status" variant={handshakeBadge}>
              {handshake === "ok" ? (
                <>
                  <CheckIcon size={12} className="mr-1" />
                  Handshake OK
                </>
              ) : handshake === "error" ? (
                <>
                  <AlertIcon size={12} className="mr-1" />
                  Handshake failed
                </>
              ) : (
                "Handshake pending"
              )}
            </Badge>
            <Badge data-testid="online-status" variant={online ? "success" : "warning"}>
              {online ? "Online" : "Offline"}
            </Badge>
            {/* Offline Readiness Badge */}
            <Badge
              data-testid="offline-ready"
              variant={offlineReady ? "success" : "warning"}
            >
              {offlineReady ? (
                <>
                  <CheckIcon size={12} className="mr-1" />
                  Ready
                </>
              ) : (
                "Not Ready"
              )}
            </Badge>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
          <div className="space-y-3">
            <Input
              label="Badge ID"
              placeholder="Scan badge or type ID"
              value={badgeId}
              ref={inputRef}
              onChange={(event) => setBadgeId(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  sendPunch();
                }
              }}
            />
            <div className="grid gap-2 sm:grid-cols-2">
              {punchTypes.map((type) => (
                <Button
                  key={type}
                  variant={selectedType === type ? "primary" : "secondary"}
                  onClick={() => setSelectedType(type)}
                >
                  {type.replace("_", " ")}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <Card className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Sync status
              </p>
              <p className="text-sm" data-testid="queue-count">
                Queue:{" "}
                <span className="font-semibold">
                  {queuedCount} {queuedCount === 1 ? "event" : "events"}
                </span>
              </p>
              <p className="text-sm text-[var(--text-muted)]" data-testid="last-sync">
                Last sync: {lastSync ?? "Not synced yet"}
              </p>
              <Button
                variant="secondary"
                onClick={syncQueue}
                loading={syncing}
                data-testid="sync-now"
              >
                Sync now
              </Button>
            </Card>
            {status ? (
              <Card className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  Status
                </p>
                <p className="text-sm" data-testid="status-message">
                  {status}
                </p>
                {success ? (
                  <p className="text-2xl font-semibold text-[var(--purple-1)]">
                    Success
                  </p>
                ) : null}
              </Card>
            ) : (
              <Skeleton className="h-24" />
            )}
          </div>
        </div>
      </Card>
      <Button variant="ghost" onClick={() => router.push("/kiosk/ready")}>
        Return to ready screen
      </Button>
    </div>
  );
}
