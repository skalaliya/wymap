import { requireRole } from "@/lib/rbac";
import { ToastProvider } from "@/components/ui/ToastProvider";
import Sidebar from "@/app/admin/(protected)/components/sidebar";
import Topbar from "@/app/admin/(protected)/components/topbar";
import Breadcrumbs from "@/app/admin/(protected)/components/breadcrumbs";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["ADMIN", "MANAGER", "SUPERVISOR"]);

  return (
    <ToastProvider>
      <div className="min-h-screen lg:flex">
        <Sidebar />
        <div className="flex-1">
          <Topbar />
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-6">
            <Breadcrumbs />
            <main>{children}</main>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
