import { requireRole } from "@/lib/rbac";
import TimesheetsClient from "@/app/admin/(protected)/timesheets/timesheets-client";

export default async function TimesheetsPage() {
  await requireRole(["ADMIN", "MANAGER", "SUPERVISOR"]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Timesheets</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Shift-based summaries with anomaly detection and resolution links.
        </p>
      </header>
      <TimesheetsClient />
    </div>
  );
}
