import { requireRole } from "@/lib/rbac";
import EmployeesClient from "@/app/admin/(protected)/employees/employees-client";
import { auth } from "@/lib/auth";

export default async function EmployeesPage() {
  await requireRole(["ADMIN", "MANAGER", "SUPERVISOR"]);

  const session = await auth();
  const canEdit = ["ADMIN", "MANAGER"].includes(session?.user.role ?? "");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Employees</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Manage employee records, deactivate access, and rotate kiosk tokens.
        </p>
      </header>
      <EmployeesClient canEdit={canEdit} />
    </div>
  );
}
