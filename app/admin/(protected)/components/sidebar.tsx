import Link from "next/link";
import { headers } from "next/headers";
import { DashboardIcon, UsersIcon, SiteIcon, DeviceIcon, TimeIcon, ReportIcon, AlertIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/admin/employees", label: "Employees", icon: UsersIcon },
  { href: "/admin/sites", label: "Sites", icon: SiteIcon },
  { href: "/admin/devices", label: "Devices", icon: DeviceIcon },
  { href: "/admin/timesheets", label: "Timesheets", icon: TimeIcon },
  { href: "/admin/corrections", label: "Corrections", icon: AlertIcon },
  { href: "/admin/reports", label: "Reports", icon: ReportIcon },
];

export default async function Sidebar() {
  const headerList = await headers();
  const path = headerList.get("x-pathname") ?? "";
  return (
    <aside className="border-b border-[var(--surface-border)] bg-[rgba(6,4,15,0.92)] px-6 py-6 lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
      <div className="space-y-6">
        <Link href="/admin/dashboard" className="flex items-center gap-3 text-lg font-semibold">
          <span className="h-3 w-3 rounded-full bg-[var(--violet-1)]" />
          Wymap Admin
        </Link>
        <nav className="space-y-2 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-[var(--text-muted)] transition hover:bg-white/5 hover:text-[var(--foreground)]",
                path.startsWith(item.href)
                  ? "bg-white/10 text-[var(--foreground)]"
                  : "",
              )}
            >
              <item.icon className="text-[var(--purple-1)]" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
