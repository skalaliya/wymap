import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { verifyCsrfToken } from "@/lib/csrf";
import { logAuditEvent } from "@/lib/audit";
import { enforceRateLimit } from "@/lib/api-rate-limit";
import { z } from "zod";

const updateEmployeeSchema = z.object({
  name: z.string().min(1).optional(),
  badgeId: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const PATCH = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const rateResponse = enforceRateLimit(request, "admin:employees:patch");
  if (rateResponse) {
    return rateResponse;
  }

  const authResult = await requireApiRole(["ADMIN", "MANAGER"]);
  if (!authResult.ok) {
    return NextResponse.json({}, { status: authResult.status });
  }

  try {
    await verifyCsrfToken();
  } catch {
    return NextResponse.json({ error: "csrf" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updateEmployeeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const existing = await prisma.employee.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const employee = await prisma.employee.update({
    where: { id },
    data: parsed.data,
  });

  await logAuditEvent({
    actorUserId: authResult.user.id,
    action: "employee.update",
    entity: "employee",
    entityId: employee.id,
    before: existing,
    after: employee,
  });

  return NextResponse.json({ employee });
};
