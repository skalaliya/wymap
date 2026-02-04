import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { verifyCsrfToken } from "@/lib/csrf";
import { logAuditEvent } from "@/lib/audit";
import { enforceRateLimit } from "@/lib/api-rate-limit";
import { z } from "zod";
import { randomUUID } from "crypto";

const createCorrectionSchema = z.object({
  originalEventId: z.string().min(1),
  reason: z.string().min(3),
  type: z.enum(["IN", "OUT", "BREAK_START", "BREAK_END"]),
  occurredAt: z.coerce.date(),
});

export const GET = async (request: Request) => {
  const rateResponse = enforceRateLimit(request, "admin:corrections:get");
  if (rateResponse) {
    return rateResponse;
  }

  const authResult = await requireApiRole(["ADMIN", "MANAGER", "SUPERVISOR"]);
  if (!authResult.ok) {
    return NextResponse.json({}, { status: authResult.status });
  }

  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const pageSize = Number(url.searchParams.get("pageSize") ?? "20");
  const query = url.searchParams.get("q");

  const where = query
    ? {
      reason: {
        contains: query,
      },
    }
    : {};

  const [corrections, total] = await Promise.all([
    prisma.correction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        originalEvent: true,
        correctionEvent: true,
        createdBy: true,
        reviewedBy: true,
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.correction.count({ where }),
  ]);

  return NextResponse.json({
    corrections: corrections.map((correction) => ({
      ...correction,
      createdAt: correction.createdAt.toISOString(),
    })),
    page,
    pageSize,
    total,
  });
};

export const POST = async (request: Request) => {
  const rateResponse = enforceRateLimit(request, "admin:corrections:post");
  if (rateResponse) {
    return rateResponse;
  }

  const authResult = await requireApiRole(["ADMIN", "MANAGER", "SUPERVISOR"]);
  if (!authResult.ok) {
    return NextResponse.json({}, { status: authResult.status });
  }

  try {
    await verifyCsrfToken();
  } catch {
    return NextResponse.json({ error: "csrf" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createCorrectionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const { originalEventId, reason, type, occurredAt } = parsed.data;
  const original = await prisma.clockEvent.findUnique({
    where: { id: originalEventId },
  });

  if (!original) {
    return NextResponse.json({ error: "original_not_found" }, { status: 404 });
  }

  const correctionEvent = await prisma.clockEvent.create({
    data: {
      employeeId: original.employeeId,
      siteId: original.siteId,
      deviceId: original.deviceId,
      type,
      source: "ADMIN",
      occurredAt,
      idempotencyKey: `admin_${randomUUID()}`,
    },
  });

  const correctionRecord = await prisma.correction.create({
    data: {
      originalEventId,
      correctionEventId: correctionEvent.id,
      reason,
      createdByUserId: authResult.user.id,
    },
  });

  await logAuditEvent({
    actorUserId: authResult.user.id,
    action: "correction.create",
    entity: "correction",
    entityId: correctionRecord.id,
    after: correctionRecord,
  });

  return NextResponse.json({ correction: correctionRecord });
};
