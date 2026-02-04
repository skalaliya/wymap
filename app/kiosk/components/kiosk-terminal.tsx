"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
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
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      {/* Success Overlay */}
      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="flex flex-col items-center gap-4 animate-scaleIn">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_60px_rgba(52,211,153,0.5)]">
              <CheckIcon size={48} className="text-white" />
            </div>
            <p className="text-2xl font-semibold text-white">Success</p>
            <p className="text-lg text-white/80" data-testid="status-message">{status}</p>
          </div>
        </div>
      )}

      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.4em] text-[var(--purple-1)]">
            Wymap Kiosk
          </p>
          <h1 className="bg-gradient-to-r from-white via-[var(--purple-1)] to-[var(--violet-1)] bg-clip-text text-5xl font-bold text-transparent">
            Punch Terminal
          </h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {deviceId} • {siteId}
          </p>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap justify-center gap-3">
          <Badge
            data-testid="handshake-status"
            variant={handshakeBadge}
            className="px-4 py-2 text-sm shadow-lg"
          >
            {handshake === "ok" ? (
              <>
                <CheckIcon size={14} className="mr-2" />
                Handshake OK
              </>
            ) : handshake === "error" ? (
              <>
                <AlertIcon size={14} className="mr-2" />
                Handshake Failed
              </>
            ) : (
              "Connecting..."
            )}
          </Badge>
          <Badge
            data-testid="online-status"
            variant={online ? "success" : "warning"}
            className="px-4 py-2 text-sm shadow-lg"
          >
            {online ? "Online" : "Offline"}
          </Badge>
          <Badge
            data-testid="offline-ready"
            variant={offlineReady ? "success" : "warning"}
            className="px-4 py-2 text-sm shadow-lg"
          >
            {offlineReady ? (
              <>
                <CheckIcon size={14} className="mr-2" />
                Ready
              </>
            ) : (
              "Not Ready"
            )}
          </Badge>
        </div>

        {/* Main Card */}
        <Card className="space-y-6 p-8">
          {/* Badge Input */}
          <div>
            <Input
              label="Badge ID"
              placeholder="Scan badge or enter ID"
              value={badgeId}
              ref={inputRef}
              onChange={(event) => setBadgeId(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  sendPunch();
                }
              }}
              className="h-16 text-2xl font-mono tracking-wider text-center"
            />
          </div>

          {/* Punch Type Buttons */}
          <div>
            <label className="mb-3 block text-sm font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Punch Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              {punchTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`
                    group relative flex h-20 items-center justify-center rounded-2xl text-lg font-semibold uppercase tracking-wide
                    transition-all duration-200 ease-out
                    ${selectedType === type
                      ? "bg-gradient-to-r from-[var(--violet-1)] to-[var(--purple-1)] text-white shadow-[0_0_30px_rgba(109,0,255,0.4)]"
                      : "bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-border)] hover:text-white border border-[var(--surface-border)]"
                    }
                    active:scale-[0.97]
                  `}
                >
                  {type.replace("_", " ")}
                  {selectedType === type && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--violet-1)] opacity-75"></span>
                      <span className="relative inline-flex h-4 w-4 rounded-full bg-[var(--purple-1)]"></span>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            variant="primary"
            onClick={sendPunch}
            className="h-16 w-full text-xl font-bold uppercase tracking-wider shadow-[0_0_40px_rgba(109,0,255,0.3)] hover:shadow-[0_0_60px_rgba(109,0,255,0.5)] transition-shadow"
          >
            Submit Punch
          </Button>

          {/* Status Message */}
          {status && !success && (
            <div className="rounded-xl bg-[var(--surface)]/50 p-4 text-center border border-[var(--surface-border)]">
              <p className="text-sm text-[var(--text-muted)]" data-testid="status-message">
                {status}
              </p>
            </div>
          )}
        </Card>

        {/* Sync Status Panel */}
        <div className="flex items-center justify-between rounded-2xl bg-[var(--surface)]/30 px-6 py-4 backdrop-blur-sm border border-[var(--surface-border)]/50">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface)]">
              <span className="text-lg font-bold text-[var(--purple-1)]" data-testid="queue-count">
                {queuedCount}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium">Queued Events</p>
              <p className="text-xs text-[var(--text-muted)]" data-testid="last-sync">
                Last sync: {lastSync ?? "Not synced yet"}
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={syncQueue}
            loading={syncing}
            data-testid="sync-now"
            className="px-6"
          >
            Sync Now
          </Button>
        </div>

        {/* Return Button */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => router.push("/kiosk/ready")}
            className="text-sm uppercase tracking-wider text-[var(--text-muted)] hover:text-white transition-colors"
          >
            ← Return to Ready Screen
          </button>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.3s ease-out; }
      `}</style>
    </div>
  );
}
