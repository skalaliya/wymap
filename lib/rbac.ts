import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isRoleAllowed, type Role } from "@/lib/rbac-core";

export { isRoleAllowed, type Role };

export const requireRole = async (roles: Role[]) => {
  const session = await auth();

  if (!session?.user?.role) {
    redirect("/admin/login");
  }

  if (!isRoleAllowed(session.user.role as Role, roles)) {
    redirect("/admin/unauthorized");
  }

  return session.user;
};
