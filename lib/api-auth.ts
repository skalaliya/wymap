import { auth } from "@/lib/auth";

type AuthResult =
  | { ok: true; user: { id: string; role: string; email?: string | null } }
  | { ok: false; status: 401 | 403 };

export const requireApiRole = async (roles: string[]): Promise<AuthResult> => {
  const session = await auth();
  if (!session?.user?.role || !session.user.id) {
    return { ok: false, status: 401 };
  }

  if (!roles.includes(session.user.role)) {
    return { ok: false, status: 403 };
  }

  return { ok: true, user: session.user };
};
