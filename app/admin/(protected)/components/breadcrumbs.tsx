import Link from "next/link";
import { headers } from "next/headers";
import { ChevronRightIcon } from "@/components/ui/icons";

const labelMap: Record<string, string> = {
  dashboard: "Dashboard",
  employees: "Employees",
  sites: "Sites",
  devices: "Devices",
  timesheets: "Timesheets",
  corrections: "Corrections",
  reports: "Reports",
};

export default async function Breadcrumbs() {
  const headerList = await headers();
  const path = headerList.get("x-pathname") ?? "";
  const parts = path.split("/").filter(Boolean);

  if (parts.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">
      <Link href="/admin/dashboard" className="hover:text-[var(--foreground)]">
        Admin
      </Link>
      {parts.map((part) => (
        <span key={part} className="flex items-center gap-2">
          <ChevronRightIcon />
          <span>{labelMap[part] ?? part}</span>
        </span>
      ))}
    </div>
  );
}
