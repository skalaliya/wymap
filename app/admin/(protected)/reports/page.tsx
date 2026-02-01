import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

export default async function ReportsPage() {
  await requireRole(["ADMIN", "MANAGER"]);

  const [employees, sites] = await Promise.all([
    prisma.employee.findMany({ select: { id: true, name: true } }),
    prisma.site.findMany({ select: { id: true, name: true } }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Export payroll-ready CSV reports by date range, site, or employee.
        </p>
      </header>
      <div className="surface space-y-4">
        <form
          className="grid gap-4 md:grid-cols-2"
          action="/api/admin/reports"
          method="GET"
        >
          <label className="flex flex-col gap-2 text-sm">
            Start date
            <input
              className="rounded-lg border border-[var(--surface-border)] bg-transparent px-3 py-2"
              name="start"
              type="date"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            End date
            <input
              className="rounded-lg border border-[var(--surface-border)] bg-transparent px-3 py-2"
              name="end"
              type="date"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            Site
            <select
              className="rounded-lg border border-[var(--surface-border)] bg-transparent px-3 py-2"
              name="siteId"
            >
              <option value="">All sites</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm">
            Employee
            <select
              className="rounded-lg border border-[var(--surface-border)] bg-transparent px-3 py-2"
              name="employeeId"
            >
              <option value="">All employees</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </label>
          <button
            className="rounded-lg bg-[var(--violet-1)]/60 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em]"
            type="submit"
          >
            Export CSV
          </button>
        </form>
      </div>
    </div>
  );
}
