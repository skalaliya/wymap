import { describe, it, expect } from "vitest";
import { isRoleAllowed } from "@/lib/rbac-core";

describe("rbac", () => {
  it("prevents supervisor from admin-only access", () => {
    expect(isRoleAllowed("SUPERVISOR", ["ADMIN"])).toBe(false);
  });
});
