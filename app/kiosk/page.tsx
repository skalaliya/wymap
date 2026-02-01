import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import KioskTerminal from "@/app/kiosk/components/kiosk-terminal";

export default async function KioskPage() {
  const employees = await prisma.employee.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-12">
      <KioskTerminal
        employees={employees}
        deviceId={env.KIOSK_DEVICE_ID ?? "unregistered-device"}
        siteId={env.KIOSK_SITE_ID ?? "unregistered-site"}
      />
    </main>
  );
}
