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

export default function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/dashboard");
    if (response.ok) {
      const json = (await response.json()) as DashboardData;
      setData(json);
      setLoading(false);
    }
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
                className="flex flex-wrap items-center justify-between gap-2"
              >
                <span>
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
    </div>
  );
}
