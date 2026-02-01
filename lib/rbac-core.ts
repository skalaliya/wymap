export type Role = "ADMIN" | "MANAGER" | "SUPERVISOR";

export const isRoleAllowed = (role: Role, roles: Role[]) =>
  roles.includes(role);
