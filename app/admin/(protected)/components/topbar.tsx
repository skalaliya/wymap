import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { SearchIcon, LogoutIcon } from "@/components/ui/icons";
import Link from "next/link";

export default async function Topbar() {
  const session = await auth();
  const userName = session?.user?.name ?? session?.user?.email ?? "Admin";

  return (
    <div className="border-b border-[var(--surface-border)] bg-[rgba(6,4,15,0.72)] px-6 py-4">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <SearchIcon className="text-[var(--text-muted)]" />
          <input
            className="w-48 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:outline-none"
            placeholder="Quick search..."
            disabled
          />
        </div>
        <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
          <span>{userName}</span>
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
