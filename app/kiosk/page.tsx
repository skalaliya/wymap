import { env } from "@/lib/env";
import KioskTerminal from "@/app/kiosk/components/kiosk-terminal";

export default async function KioskPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-6 py-12">
      <KioskTerminal
        deviceId={env.KIOSK_DEVICE_ID ?? "unregistered-device"}
        siteId={env.KIOSK_SITE_ID ?? "unregistered-site"}
      />
    </main>
  );
}
