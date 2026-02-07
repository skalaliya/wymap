"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/app/admin/(protected)/components/sidebar";
import Topbar from "@/app/admin/(protected)/components/topbar";
import Breadcrumbs from "@/app/admin/(protected)/components/breadcrumbs";
import { CloseIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

type AdminShellProps = {
  userName: string;
  children: ReactNode;
};

export default function AdminShell({ userName, children }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  return (
    <div className="min-h-screen overflow-x-clip lg:flex">
      <div className="hidden lg:block lg:w-64 lg:shrink-0">
        <Sidebar />
      </div>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 transition-opacity lg:hidden",
          mobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
        onClick={() => setMobileOpen(false)}
        aria-hidden
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 max-w-[82vw] transform border-r border-[var(--surface-border)] bg-[rgba(6,4,15,0.97)] shadow-2xl transition-transform lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full pointer-events-none",
        )}
        aria-label="Admin navigation drawer"
        aria-hidden={!mobileOpen}
      >
        <div className="flex items-center justify-end px-5 py-3">
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--surface-border)] text-[var(--text-muted)] transition hover:bg-white/5 hover:text-[var(--foreground)]"
            aria-label="Close navigation menu"
          >
            <CloseIcon size={18} />
          </button>
        </div>
        <Sidebar className="h-[calc(100%-4rem)] border-b-0 border-r-0 bg-transparent py-3" onNavigate={() => setMobileOpen(false)} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar userName={userName} onOpenMenu={() => setMobileOpen(true)} />
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-3 py-5 sm:gap-6 sm:px-6 sm:py-6">
          <Breadcrumbs />
          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
