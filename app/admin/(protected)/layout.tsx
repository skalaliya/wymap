import { requireRole } from "@/lib/rbac";
import { ToastProvider } from "@/components/ui/ToastProvider";
import AdminShell from "@/app/admin/(protected)/components/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(["ADMIN", "MANAGER", "SUPERVISOR"]);
  const userName = user.name ?? user.email ?? "Admin";

  return (
    <ToastProvider>
      <AdminShell userName={userName}>{children}</AdminShell>
    </ToastProvider>
  );
}
