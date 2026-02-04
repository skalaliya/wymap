"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function ReadyClient() {
  const router = useRouter();
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="flex min-h-screen cursor-pointer flex-col items-center justify-center gap-6 px-6 text-center"
      onClick={() => router.push("/kiosk")}
      onKeyDown={(event) => {
        if (event.key === "Enter") router.push("/kiosk");
      }}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-center gap-3 text-sm uppercase tracking-[0.3em] text-[var(--text-muted)]">
        <span className="h-3 w-3 rounded-full bg-[var(--violet-1)]" />
        Wymap Workforce
      </div>
      <h1 className="text-5xl font-semibold min-h-[1.2em]">
        {time ? (
          time.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          })
        ) : (
          <span className="opacity-0">00:00</span>
        )}
      </h1>
      <p className="max-w-lg text-base text-[var(--text-muted)]">
        Tap anywhere or scan your badge to punch in or out. The kiosk will stay
        ready for quick scans.
      </p>
      <Button>Start punch</Button>
    </div>
  );
}
