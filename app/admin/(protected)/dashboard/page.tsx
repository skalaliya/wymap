import DashboardClient from "@/app/admin/(protected)/dashboard/dashboard-client";
import { requireRole } from "@/lib/rbac";

export default async function DashboardPage() {
  await requireRole(["ADMIN", "MANAGER", "SUPERVISOR"]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Live workforce overview refreshed every 12 seconds.
        </p>
      </header>
      <DashboardClient />
    </div>
  );
}
