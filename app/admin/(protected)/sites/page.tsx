import { requireRole } from "@/lib/rbac";
import SitesClient from "@/app/admin/(protected)/sites/sites-client";
import { auth } from "@/lib/auth";

export default async function SitesPage() {
  await requireRole(["ADMIN", "MANAGER", "SUPERVISOR"]);

  const session = await auth();
  const canEdit = ["ADMIN", "MANAGER"].includes(session?.user.role ?? "");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Sites</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Manage locations, time zones, and site availability.
        </p>
      </header>
      <SitesClient canEdit={canEdit} />
    </div>
  );
}
