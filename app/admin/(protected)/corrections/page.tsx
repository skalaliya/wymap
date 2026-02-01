import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import CorrectionsClient from "@/app/admin/(protected)/corrections/corrections-client";

export default async function CorrectionsPage() {
  await requireRole(["ADMIN", "MANAGER", "SUPERVISOR"]);

  const [events, corrections] = await Promise.all([
    prisma.clockEvent.findMany({
      orderBy: { occurredAt: "desc" },
      take: 50,
      include: { employee: true },
    }),
    prisma.correction.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  const eventOptions = events.map((event) => ({
    id: event.id,
    label: `${event.employee.name} • ${event.type} • ${event.occurredAt.toISOString()}`,
    employeeId: event.employeeId,
    siteId: event.siteId,
    deviceId: event.deviceId,
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Corrections</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Submit and approve time corrections. All corrections are append-only.
        </p>
      </header>
      <CorrectionsClient
        events={eventOptions}
        initialCorrections={corrections.map((correction) => ({
          ...correction,
          createdAt: correction.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
