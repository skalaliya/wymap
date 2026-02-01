"use client";

import { useState } from "react";
import { useCsrfToken } from "@/app/admin/(protected)/components/use-csrf-token";

type EventOption = {
  id: string;
  label: string;
  employeeId: string;
  siteId: string;
  deviceId: string;
};

type Correction = {
  id: string;
  status: string;
  reason: string;
  originalEventId: string;
  correctionEventId: string;
  createdAt: string;
};

type Props = {
  events: EventOption[];
  initialCorrections: Correction[];
};

export default function CorrectionsClient({ events, initialCorrections }: Props) {
  const [corrections, setCorrections] = useState(initialCorrections);
  const [originalEventId, setOriginalEventId] = useState(events[0]?.id ?? "");
  const [type, setType] = useState<"IN" | "OUT" | "BREAK_START" | "BREAK_END">(
    "IN",
  );
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const csrfToken = useCsrfToken();

  const submitCorrection = async () => {
    if (!csrfToken || !originalEventId) return;
    const response = await fetch("/api/admin/corrections", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify({
        originalEventId,
        reason,
        type,
        occurredAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      setMessage("Failed to submit correction.");
      return;
    }

    const data = await response.json();
    setCorrections((prev) => [
      {
        ...data.correction,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setReason("");
    setMessage("Correction requested.");
  };

  const reviewCorrection = async (id: string, status: "APPROVED" | "REJECTED") => {
    if (!csrfToken) return;
    const response = await fetch(`/api/admin/corrections/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      setMessage("Failed to update correction.");
      return;
    }

    const data = await response.json();
    setCorrections((prev) =>
      prev.map((item) => (item.id === id ? data.correction : item)),
    );
  };

  return (
    <div className="space-y-6">
      <div className="surface space-y-4">
        <h2 className="text-xl font-semibold">Request correction</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <select
            className="rounded-lg border border-[var(--surface-border)] bg-transparent px-3 py-2"
            value={originalEventId}
            onChange={(event) => setOriginalEventId(event.target.value)}
          >
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.label}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-[var(--surface-border)] bg-transparent px-3 py-2"
            value={type}
            onChange={(event) => setType(event.target.value as typeof type)}
          >
            <option value="IN">IN</option>
            <option value="OUT">OUT</option>
            <option value="BREAK_START">BREAK START</option>
            <option value="BREAK_END">BREAK END</option>
          </select>
          <input
            className="rounded-lg border border-[var(--surface-border)] bg-transparent px-3 py-2 md:col-span-2"
            placeholder="Reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </div>
        <button
          className="rounded-lg bg-[var(--violet-1)]/60 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em]"
          type="button"
          onClick={submitCorrection}
        >
          Submit
        </button>
        {message ? <p className="text-sm">{message}</p> : null}
      </div>

      <div className="surface space-y-4">
        <h2 className="text-xl font-semibold">Pending corrections</h2>
        <div className="space-y-3 text-sm text-[var(--text-muted)]">
          {corrections.map((correction) => (
            <div
              key={correction.id}
              className="flex flex-wrap items-center justify-between gap-3"
            >
              <div>
                <p className="text-[var(--foreground)]">{correction.reason}</p>
                <p>Status: {correction.status}</p>
                <p>Requested: {new Date(correction.createdAt).toLocaleString()}</p>
              </div>
              {correction.status === "PENDING" ? (
                <div className="flex gap-2">
                  <button
                    className="rounded-lg border border-[var(--surface-border)] px-3 py-2"
                    type="button"
                    onClick={() => reviewCorrection(correction.id, "APPROVED")}
                  >
                    Approve
                  </button>
                  <button
                    className="rounded-lg border border-[var(--surface-border)] px-3 py-2"
                    type="button"
                    onClick={() => reviewCorrection(correction.id, "REJECTED")}
                  >
                    Reject
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
