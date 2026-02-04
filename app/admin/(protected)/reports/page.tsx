import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import ReportsClient from "@/app/admin/(protected)/reports/reports-client";

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
          Build payroll-ready CSV reports with shareable filters.
        </p>
      </header>
      <ReportsClient employees={employees} sites={sites} />
    </div>
  );
}
