/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { usePoll } from "@/lib/poll";

type OfflineDevice = {
  id: string;
  name: string;
  site: string;
  lastSeenAt: string | null;
};

type DashboardData = {
  activityCount: number;
  onsiteCount: number;
  missingCheckoutCount: number;
  offlineDevices: OfflineDevice[];
};

type HealthData = {
  ok: boolean;
  db: { ok: boolean };
  env: Record<string, boolean>;
  version: string;
  gitCommit: string | null;
  time?: string;
};

export default function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [dashboardResponse, healthResponse] = await Promise.all([
      fetch("/api/admin/dashboard"),
      fetch("/api/health"),
    ]);
    if (dashboardResponse.ok) {
      const json = (await dashboardResponse.json()) as DashboardData;
      setData(json);
    }
    if (healthResponse.ok) {
      const json = (await healthResponse.json()) as HealthData;
      setHealth(json);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  usePoll(load, 12000);

  if (loading || !data) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
    );
  }

  const configuredCount = health ? Object.values(health.env).filter(Boolean).length : 0;
  const totalEnvCount = health ? Object.keys(health.env).length : 0;
  const healthCheckedAt = health?.time
    ? new Date(health.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "Unknown";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">
            Today activity
          </p>
          <p className="text-3xl font-semibold">{data.activityCount}</p>
          <p className="text-sm text-[var(--text-muted)]">
            Total punches today
          </p>
        </Card>
        <Card className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">
            On site now
          </p>
          <p className="text-3xl font-semibold">{data.onsiteCount}</p>
          <Link
            className="text-sm text-[var(--purple-1)]"
            href="/admin/timesheets?filter=onsite"
          >
            View active shifts
          </Link>
        </Card>
        <Card className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">
            Missing checkout
          </p>
          <p className="text-3xl font-semibold">{data.missingCheckoutCount}</p>
          <Link
            className="text-sm text-[var(--purple-1)]"
            href="/admin/timesheets?filter=missing-out"
          >
            Review anomalies
          </Link>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Offline devices</h2>
            <Badge variant={data.offlineDevices.length ? "warning" : "success"}>
              {data.offlineDevices.length ? "Needs attention" : "Healthy"}
            </Badge>
          </div>
          {data.offlineDevices.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">
              All devices reporting within the last 10 minutes.
            </p>
          ) : (
            <div className="space-y-2 text-sm">
              {data.offlineDevices.map((device) => (
                <div
                  key={device.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--surface-border)]/70 px-3 py-2"
                >
                  <span className="min-w-0 truncate">
                    {device.name} • {device.site}
                  </span>
                  <span className="text-[var(--text-muted)]">
                    Last seen: {device.lastSeenAt ?? "Never"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">System status</h2>
            <Badge variant={health?.ok ? "success" : "warning"}>
              {health?.ok ? "Operational" : "Check config"}
            </Badge>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Database</span>
              <span>{health?.db.ok ? "Connected" : "Unavailable"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Config</span>
              <span>
                {health ? `${configuredCount} / ${totalEnvCount} set` : "Checking..."}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Version</span>
              <span className="truncate">{health?.version ?? "Unknown"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Last check</span>
              <span>{healthCheckedAt}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
