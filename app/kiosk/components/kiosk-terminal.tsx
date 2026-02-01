"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  countQueuedEvents,
  enqueueEvent,
  listQueuedEvents,
  removeQueuedEvent,
} from "@/lib/offline-queue";

type Props = {
type Employee = {
  id: string;
  name: string;
};

type Props = {
  employees: Employee[];
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
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [badgeId, setBadgeId] = useState("");
  const [selectedType, setSelectedType] =
    useState<ClockEventPayload["type"]>("IN");
  const [status, setStatus] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const resetIdle = useCallback(() => {
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
    }
    idleTimer.current = setTimeout(() => {
      router.push("/kiosk/ready");
    }, idleMs);
  }, [router]);
export default function KioskTerminal({
  employees,
  deviceId,
  siteId,
}: Props) {
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "");
  const [online, setOnline] = useState(true);
  const [queuedCount, setQueuedCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const selectedEmployee = useMemo(
    () => employees.find((employee) => employee.id === employeeId),
    [employees, employeeId],
  );

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

  useEffect(() => {
    setOnline(navigator.onLine);
    updateQueuedCount();
    const runHandshake = async () => {
      try {
        const response = await fetch("/api/kiosk/handshake", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId, siteId }),
        });
        setHandshake(response.ok ? "ok" : "error");
      } catch {
        setHandshake("error");
        if (!response.ok) {
          setStatus("Device not registered. Contact admin.");
        }
      } catch {
        setStatus("Handshake failed. Check network.");
      }
    };

    runHandshake();
    syncQueue();
    resetIdle();

    const handleOnline = () => {
      setOnline(true);
      syncQueue();
    };
    const handleOffline = () => setOnline(false);
    const handleInteraction = () => resetIdle();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("keydown", handleInteraction);
    window.addEventListener("mousemove", handleInteraction);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("keydown", handleInteraction);
      window.removeEventListener("mousemove", handleInteraction);
    };
  }, [deviceId, siteId, resetIdle, syncQueue, updateQueuedCount]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [badgeId, success]);

  const resolveEmployee = async () => {
    const response = await fetch("/api/kiosk/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ badgeId }),
    });
    if (!response.ok) {
      throw new Error("employee_not_found");
    }
    return response.json() as Promise<{ employeeId: string; employeeName: string }>;
  };

  const sendPunch = async () => {
    if (!badgeId) {
      setStatus("Scan or enter a badge ID to continue.");
      beep("error");
      return;
    }

    const { employeeId, employeeName } = await resolveEmployee();
    };
  }, [deviceId, siteId, syncQueue, updateQueuedCount]);

  const sendPunch = async (type: ClockEventPayload["type"]) => {
    if (!employeeId) {
      setStatus("Select an employee first.");
      return;
    }

    const idempotencyKey = crypto.randomUUID();
    const payload: ClockEventPayload = {
      employeeId,
      siteId,
      deviceId,
      type: selectedType,
      type,
      source: online ? "KIOSK" : "OFFLINE_SYNC",
      occurredAt: new Date().toISOString(),
      idempotencyKey,
    };

    if (!online) {
      await enqueueEvent(payload, idempotencyKey);
      await updateQueuedCount();
      setStatus(`Saved offline for ${employeeName}.`);
      setBadgeId("");
      setStatus("Saved offline. Will sync when online.");
      return;
    }

    try {
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
        return;
      }

      setStatus(`Punch ${type.replace("_", " ")} recorded.`);
    } catch {
      await enqueueEvent(payload, idempotencyKey);
      await updateQueuedCount();
      setStatus("Network error. Saved offline for retry.");
      beep("error");
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
            <Badge variant={handshakeBadge}>
              {handshake === "ok"
                ? "Handshake OK"
                : handshake === "error"
                ? "Handshake failed"
                : "Handshake pending"}
            </Badge>
            <Badge variant={online ? "success" : "warning"}>
              {online ? "Online" : "Offline"}
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
              <p className="text-sm">
                Queue:{" "}
                <span className="font-semibold">
                  {queuedCount} {queuedCount === 1 ? "event" : "events"}
                </span>
              </p>
              <p className="text-sm text-[var(--text-muted)]">
                Last sync: {lastSync ?? "Not synced yet"}
              </p>
              <Button variant="secondary" onClick={syncQueue} loading={syncing}>
                Sync now
              </Button>
            </Card>
            {status ? (
              <Card className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  Status
                </p>
                <p className="text-sm">{status}</p>
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
    }
  };

  return (
    <div className="surface space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-[var(--text-muted)]">
          Space Dark Kiosk
        </p>
        <h1 className="text-3xl font-semibold">Punch Terminal</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Device {deviceId} • Site {siteId}
        </p>
      </header>

      <div className="space-y-3">
        <label className="text-sm text-[var(--text-muted)]" htmlFor="employee">
          Employee
        </label>
        <select
          id="employee"
          className="w-full rounded-lg border border-[var(--surface-border)] bg-transparent px-4 py-3 text-base"
          value={employeeId}
          onChange={(event) => setEmployeeId(event.target.value)}
        >
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name}
            </option>
          ))}
        </select>
        <p className="text-sm text-[var(--text-muted)]">
          Selected: {selectedEmployee?.name ?? "None"}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {punchTypes.map((type) => (
          <button
            key={type}
            className="rounded-lg border border-[var(--surface-border)] bg-[var(--purple-1)]/20 px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] hover:bg-[var(--purple-1)]/40"
            type="button"
            onClick={() => sendPunch(type)}
            disabled={!employeeId}
          >
            {type.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="space-y-2 text-sm text-[var(--text-muted)]">
        <p>
          Status:{" "}
          <span className="text-[var(--foreground)]">
            {online ? "Online" : "Offline"}
          </span>
        </p>
        <p>
          Offline queue: {queuedCount} {queuedCount === 1 ? "event" : "events"}
          {syncing ? " (syncing...)" : ""}
        </p>
        {status ? <p className="text-[var(--foreground)]">{status}</p> : null}
      </div>
    </div>
  );
}
