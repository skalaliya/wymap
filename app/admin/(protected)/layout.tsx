import Link from "next/link";
import { requireRole } from "@/lib/rbac";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["ADMIN", "MANAGER", "SUPERVISOR"]);

  return (
    <div className="min-h-screen">
      <nav className="border-b border-[var(--surface-border)] px-6 py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-6">
          <Link href="/admin/dashboard" className="font-semibold">
            Wymap Admin
          </Link>
          <div className="flex flex-wrap gap-4 text-sm text-[var(--text-muted)]">
            <Link href="/admin/dashboard">Dashboard</Link>
            <Link href="/admin/employees">Employees</Link>
            <Link href="/admin/sites">Sites</Link>
            <Link href="/admin/devices">Devices</Link>
            <Link href="/admin/timesheets">Timesheets</Link>
            <Link href="/admin/corrections">Corrections</Link>
            <Link href="/admin/reports">Reports</Link>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
