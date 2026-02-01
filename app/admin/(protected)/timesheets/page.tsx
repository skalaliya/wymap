import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

export default async function TimesheetsPage() {
  await requireRole(["ADMIN", "MANAGER", "SUPERVISOR"]);

  const date = new Date();
  date.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const [employees, events] = await Promise.all([
    prisma.employee.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.clockEvent.findMany({
      where: { occurredAt: { gte: date, lte: end } },
      orderBy: { occurredAt: "asc" },
    }),
  ]);

  const byEmployee = events.reduce<Record<string, typeof events>>(
    (acc, event) => {
      acc[event.employeeId] = acc[event.employeeId] ?? [];
      acc[event.employeeId].push(event);
      return acc;
    },
    {},
  );

  const rows = employees.map((employee) => {
    const employeeEvents = byEmployee[employee.id] ?? [];
    const ins = employeeEvents.filter((event) => event.type === "IN");
    const outs = employeeEvents.filter((event) => event.type === "OUT");
    const breaks = employeeEvents.filter((event) =>
      ["BREAK_START", "BREAK_END"].includes(event.type),
    );

    const firstIn = ins[0]?.occurredAt ?? null;
    const lastOut = outs[outs.length - 1]?.occurredAt ?? null;
    let totalMinutes = 0;
    if (firstIn && lastOut) {
      totalMinutes = Math.max(
        0,
        (lastOut.getTime() - firstIn.getTime()) / 1000 / 60,
      );
    }

    let breakMinutes = 0;
    for (let i = 0; i < breaks.length; i += 2) {
      const start = breaks[i];
      const endBreak = breaks[i + 1];
      if (start && endBreak) {
        breakMinutes +=
          (endBreak.occurredAt.getTime() - start.occurredAt.getTime()) /
          1000 /
          60;
      }
    }

    const anomalies = [];
    if (!firstIn) anomalies.push("Missing IN");
    if (!lastOut) anomalies.push("Missing OUT");
    if (ins.length > 1) anomalies.push("Multiple IN punches");
    if (outs.length > 1) anomalies.push("Multiple OUT punches");

    return {
      employee,
      firstIn,
      lastOut,
      totalMinutes,
      breakMinutes,
      anomalies,
    };
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Timesheets</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Daily summary for {date.toDateString()}.
        </p>
      </header>
      <div className="surface overflow-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-[var(--text-muted)]">
            <tr>
              <th className="py-2">Employee</th>
              <th className="py-2">First in</th>
              <th className="py-2">Last out</th>
              <th className="py-2">Total</th>
              <th className="py-2">Breaks</th>
              <th className="py-2">Anomalies</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.employee.id} className="border-t border-[var(--surface-border)]">
                <td className="py-3">{row.employee.name}</td>
                <td className="py-3">
                  {row.firstIn ? row.firstIn.toLocaleTimeString() : "-"}
                </td>
                <td className="py-3">
                  {row.lastOut ? row.lastOut.toLocaleTimeString() : "-"}
                </td>
                <td className="py-3">
                  {row.totalMinutes ? formatDuration(Math.round(row.totalMinutes)) : "-"}
                </td>
                <td className="py-3">
                  {row.breakMinutes ? formatDuration(Math.round(row.breakMinutes)) : "-"}
                </td>
                <td className="py-3 text-red-300">
                  {row.anomalies.length ? row.anomalies.join(", ") : "None"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
