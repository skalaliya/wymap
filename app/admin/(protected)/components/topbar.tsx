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
    <div className="border-b border-[var(--surface-border)] bg-[rgba(6,4,15,0.72)] px-4 py-4 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-sm text-[var(--text-muted)]">
          <button
            type="button"
            onClick={onOpenMenu}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--surface-border)] text-[var(--text-muted)] transition hover:bg-white/5 hover:text-[var(--foreground)] lg:hidden"
            aria-label="Open navigation menu"
          >
            <MenuIcon size={18} />
          </button>
          <SearchIcon className="text-[var(--text-muted)]" />
          <input
            className="w-40 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:outline-none sm:w-48"
            placeholder="Quick search..."
            disabled
          />
        </div>
        <div className="flex min-w-0 items-center gap-3 text-sm text-[var(--text-muted)]">
          <span className="truncate">{userName}</span>
          <Link href="/api/auth/signout">
            <Button variant="secondary">
              <LogoutIcon />
              Sign out
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
