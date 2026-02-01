"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  countQueuedEvents,
  enqueueEvent,
  listQueuedEvents,
  removeQueuedEvent,
} from "@/lib/offline-queue";

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
        if (!response.ok) {
          setStatus("Device not registered. Contact admin.");
        }
      } catch {
        setStatus("Handshake failed. Check network.");
      }
    };

    runHandshake();
    syncQueue();

    const handleOnline = () => {
      setOnline(true);
      syncQueue();
    };
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
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
      type,
      source: online ? "KIOSK" : "OFFLINE_SYNC",
      occurredAt: new Date().toISOString(),
      idempotencyKey,
    };

    if (!online) {
      await enqueueEvent(payload, idempotencyKey);
      await updateQueuedCount();
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
        return;
      }

      setStatus(`Punch ${type.replace("_", " ")} recorded.`);
    } catch {
      await enqueueEvent(payload, idempotencyKey);
      await updateQueuedCount();
      setStatus("Network error. Saved offline for retry.");
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
