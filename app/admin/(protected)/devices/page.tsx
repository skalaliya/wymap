import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import DevicesClient from "@/app/admin/(protected)/devices/devices-client";
import { auth } from "@/lib/auth";

export default async function DevicesPage() {
  await requireRole(["ADMIN", "MANAGER", "SUPERVISOR"]);

  const sites = await prisma.site.findMany({ select: { id: true, name: true } });
  const session = await auth();
  const canEdit = ["ADMIN", "MANAGER"].includes(session?.user.role ?? "");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Devices</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Register kiosks, assign them to sites, and monitor last seen status.
        </p>
      </header>
      <DevicesClient sites={sites} canEdit={canEdit} />
    </div>
  );
}
