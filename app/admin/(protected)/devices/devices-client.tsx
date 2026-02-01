"use client";

import { useState } from "react";
import { useCsrfToken } from "@/app/admin/(protected)/components/use-csrf-token";

type Site = {
  id: string;
  name: string;
};

type Device = {
  id: string;
  name: string;
  siteId: string;
  active: boolean;
  lastSeenAt: string | null;
};

type Props = {
  initialDevices: Device[];
  sites: Site[];
  canEdit: boolean;
};

export default function DevicesClient({
  initialDevices,
  sites,
  canEdit,
}: Props) {
  const [devices, setDevices] = useState(initialDevices);
  const [name, setName] = useState("");
  const [siteId, setSiteId] = useState(sites[0]?.id ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const csrfToken = useCsrfToken();

  const createDevice = async () => {
    if (!csrfToken) return;
    const response = await fetch("/api/admin/devices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify({ name, siteId, active: true }),
    });
    if (!response.ok) {
      setMessage("Failed to create device.");
      return;
    }
    const data = await response.json();
    setDevices((prev) => [...prev, data.device]);
    setName("");
    setMessage("Device created.");
  };

  const toggleActive = async (device: Device) => {
    if (!csrfToken) return;
    const response = await fetch(`/api/admin/devices/${device.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify({ active: !device.active }),
    });
    if (!response.ok) {
      setMessage("Failed to update device.");
      return;
    }
    const data = await response.json();
    setDevices((prev) =>
      prev.map((item) => (item.id === device.id ? data.device : item)),
    );
  };

  return (
    <div className="space-y-6">
      {canEdit ? (
        <div className="surface space-y-4">
          <h2 className="text-xl font-semibold">Register device</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <input
              className="rounded-lg border border-[var(--surface-border)] bg-transparent px-3 py-2"
              placeholder="Device name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <select
              className="rounded-lg border border-[var(--surface-border)] bg-transparent px-3 py-2"
              value={siteId}
              onChange={(event) => setSiteId(event.target.value)}
            >
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
            <button
              className="rounded-lg bg-[var(--violet-1)]/60 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em]"
              type="button"
              onClick={createDevice}
            >
              Register
            </button>
          </div>
          {message ? <p className="text-sm">{message}</p> : null}
        </div>
      ) : null}

      <div className="surface space-y-4">
        <h2 className="text-xl font-semibold">Devices</h2>
        <div className="space-y-3 text-sm text-[var(--text-muted)]">
          {devices.map((device) => (
            <div
              key={device.id}
              className="flex flex-wrap items-center justify-between gap-3"
            >
              <div>
                <p className="text-[var(--foreground)]">{device.name}</p>
                <p>Site: {sites.find((site) => site.id === device.siteId)?.name}</p>
                <p>Status: {device.active ? "Active" : "Inactive"}</p>
                <p>
                  Last seen: {device.lastSeenAt ?? "Never"}
                </p>
              </div>
              {canEdit ? (
                <button
                  className="rounded-lg border border-[var(--surface-border)] px-3 py-2"
                  type="button"
                  onClick={() => toggleActive(device)}
                >
                  {device.active ? "Deactivate" : "Activate"}
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
