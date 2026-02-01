import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { verifyCsrfToken } from "@/lib/csrf";
import { logAuditEvent } from "@/lib/audit";
import { enforceRateLimit } from "@/lib/api-rate-limit";
import { z } from "zod";

const reviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

export const PATCH = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const rateResponse = enforceRateLimit(request, "admin:corrections:patch");
  if (rateResponse) {
    return rateResponse;
  }

  const authResult = await requireApiRole(["ADMIN", "SUPERVISOR"]);
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
  const parsed = reviewSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const existing = await prisma.correction.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const correction = await prisma.correction.update({
    where: { id },
    data: {
      status: parsed.data.status,
      reviewedByUserId: authResult.user.id,
      reviewedAt: new Date(),
    },
  });

  await logAuditEvent({
    actorUserId: authResult.user.id,
    action: "correction.review",
    entity: "correction",
    entityId: correction.id,
    before: existing,
    after: correction,
  });

  return NextResponse.json({ correction });
};
