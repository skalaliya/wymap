import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { verifyCsrfToken } from "@/lib/csrf";
import { logAuditEvent } from "@/lib/audit";
import { enforceRateLimit } from "@/lib/api-rate-limit";

export const POST = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const rateResponse = enforceRateLimit(_request, "admin:employees:rotate");
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
  const employee = await prisma.employee.findUnique({ where: { id } });
  if (!employee) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const newToken = `emp_${randomUUID()}`;
  const tokenHash = await bcrypt.hash(newToken, 10);

  const updated = await prisma.employee.update({
    where: { id },
    data: {
      tokenHash,
      tokenUpdatedAt: new Date(),
    },
  });

  await logAuditEvent({
    actorUserId: authResult.user.id,
    action: "employee.rotateToken",
    entity: "employee",
    entityId: updated.id,
    before: { tokenUpdatedAt: employee.tokenUpdatedAt },
    after: { tokenUpdatedAt: updated.tokenUpdatedAt },
  });

  return NextResponse.json({ token: newToken });
};
