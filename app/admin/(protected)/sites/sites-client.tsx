"use client";

import { useState } from "react";
import { useCsrfToken } from "@/app/admin/(protected)/components/use-csrf-token";

type Site = {
  id: string;
  name: string;
  timeZone: string;
  active: boolean;
};

type Props = {
  initialSites: Site[];
  canEdit: boolean;
};

export default function SitesClient({ initialSites, canEdit }: Props) {
  const [sites, setSites] = useState(initialSites);
  const [name, setName] = useState("");
  const [timeZone, setTimeZone] = useState("UTC");
  const [message, setMessage] = useState<string | null>(null);
  const csrfToken = useCsrfToken();

  const createSite = async () => {
    if (!csrfToken) return;
    const response = await fetch("/api/admin/sites", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify({ name, timeZone, active: true }),
    });
    if (!response.ok) {
      setMessage("Failed to create site.");
      return;
    }
    const data = await response.json();
    setSites((prev) => [...prev, data.site]);
    setName("");
    setMessage("Site created.");
  };

  const toggleActive = async (site: Site) => {
    if (!csrfToken) return;
    const response = await fetch(`/api/admin/sites/${site.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify({ active: !site.active }),
    });
    if (!response.ok) {
      setMessage("Failed to update site.");
      return;
    }
    const data = await response.json();
    setSites((prev) =>
      prev.map((item) => (item.id === site.id ? data.site : item)),
    );
  };

  return (
    <div className="space-y-6">
      {canEdit ? (
        <div className="surface space-y-4">
          <h2 className="text-xl font-semibold">Add site</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <input
              className="rounded-lg border border-[var(--surface-border)] bg-transparent px-3 py-2"
              placeholder="Site name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <input
              className="rounded-lg border border-[var(--surface-border)] bg-transparent px-3 py-2"
              placeholder="Time zone"
              value={timeZone}
              onChange={(event) => setTimeZone(event.target.value)}
            />
            <button
              className="rounded-lg bg-[var(--violet-1)]/60 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em]"
              type="button"
              onClick={createSite}
            >
              Create
            </button>
          </div>
          {message ? <p className="text-sm">{message}</p> : null}
        </div>
      ) : null}

      <div className="surface space-y-4">
        <h2 className="text-xl font-semibold">Sites</h2>
        <div className="space-y-3 text-sm text-[var(--text-muted)]">
          {sites.map((site) => (
            <div
              key={site.id}
              className="flex flex-wrap items-center justify-between gap-3"
            >
              <div>
                <p className="text-[var(--foreground)]">{site.name}</p>
                <p>Time zone: {site.timeZone}</p>
                <p>Status: {site.active ? "Active" : "Inactive"}</p>
              </div>
              {canEdit ? (
                <button
                  className="rounded-lg border border-[var(--surface-border)] px-3 py-2"
                  type="button"
                  onClick={() => toggleActive(site)}
                >
                  {site.active ? "Deactivate" : "Activate"}
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
