import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

export default async function DashboardPage() {
  await requireRole(["ADMIN", "MANAGER", "SUPERVISOR"]);
  const now = new Date();
  const referenceTime = now.getTime();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const [eventsToday, devices] = await Promise.all([
    prisma.clockEvent.findMany({
      where: { occurredAt: { gte: startOfDay } },
      include: { site: true },
    }),
    prisma.device.findMany({ include: { site: true } }),
  ]);

  const siteCounts = eventsToday.reduce<Record<string, number>>((acc, event) => {
    acc[event.site.name] = (acc[event.site.name] ?? 0) + 1;
    return acc;
  }, {});

  const offlineDevices = devices.filter((device) => {
    if (!device.lastSeenAt) {
      return true;
    }
    const minutesSince =
      (referenceTime - device.lastSeenAt.getTime()) / 1000 / 60;
    return minutesSince > 10;
  });

  return (
    <div className="space-y-6">
      <div className="surface">
        <h1 className="text-2xl font-semibold">Today’s activity</h1>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {Object.keys(siteCounts).length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">
              No punches recorded yet.
            </p>
          ) : (
            Object.entries(siteCounts).map(([site, count]) => (
              <div
                key={site}
                className="rounded-lg border border-[var(--surface-border)] p-4"
              >
                <p className="text-sm text-[var(--text-muted)]">{site}</p>
                <p className="text-2xl font-semibold">{count} punches</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="surface">
        <h2 className="text-xl font-semibold">Offline devices</h2>
        <div className="mt-4 space-y-3 text-sm text-[var(--text-muted)]">
          {offlineDevices.length === 0 ? (
            <p>All devices reporting.</p>
          ) : (
            offlineDevices.map((device) => (
              <div key={device.id} className="flex justify-between">
                <span>
                  {device.name} • {device.site.name}
                </span>
                <span>
                  Last seen:{" "}
                  {device.lastSeenAt
                    ? device.lastSeenAt.toISOString()
                    : "Never"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
