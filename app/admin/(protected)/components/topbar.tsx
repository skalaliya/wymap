"use client";

import { Button } from "@/components/ui/Button";
import { SearchIcon, LogoutIcon, MenuIcon } from "@/components/ui/icons";
import Link from "next/link";

type TopbarProps = {
  userName: string;
  onOpenMenu: () => void;
};

export default function Topbar({ userName, onOpenMenu }: TopbarProps) {
  return (
    <div className="sticky top-0 z-30 border-b border-[var(--surface-border)] bg-[rgba(6,4,15,0.82)] px-3 py-3 backdrop-blur sm:px-6 sm:py-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 sm:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 text-sm text-[var(--text-muted)]">
          <button
            type="button"
            onClick={onOpenMenu}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--surface-border)] text-[var(--text-muted)] transition hover:bg-white/5 hover:text-[var(--foreground)] lg:hidden"
            aria-label="Open navigation menu"
            data-testid="admin-menu-button"
          >
            <MenuIcon size={18} />
          </button>
          <SearchIcon className="hidden text-[var(--text-muted)] sm:block" />
          <input
            className="hidden w-40 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:outline-none sm:block sm:w-48"
            placeholder="Quick search..."
            disabled
          />
        </div>
        <div className="flex min-w-0 items-center gap-2 text-sm text-[var(--text-muted)] sm:gap-3">
          <span className="hidden max-w-[10rem] truncate sm:block">{userName}</span>
          <Link href="/api/auth/signout">
            <Button variant="secondary" className="min-h-11 px-3 sm:px-4">
              <LogoutIcon />
              Sign out
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
