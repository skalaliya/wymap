import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { verifyCsrfToken } from "@/lib/csrf";
import { logAuditEvent } from "@/lib/audit";
import { enforceRateLimit } from "@/lib/api-rate-limit";
import { z } from "zod";

const createSiteSchema = z.object({
  name: z.string().min(1),
  timeZone: z.string().min(1).default("UTC"),
  active: z.boolean().optional(),
});

export const GET = async (request: Request) => {
  const rateResponse = enforceRateLimit(request, "admin:sites:get");
  if (rateResponse) {
    return rateResponse;
  }

  const authResult = await requireApiRole(["ADMIN", "MANAGER", "SUPERVISOR"]);
  if (!authResult.ok) {
    return NextResponse.json({}, { status: authResult.status });
  }

  const sites = await prisma.site.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ sites });
};

export const POST = async (request: Request) => {
  const rateResponse = enforceRateLimit(request, "admin:sites:post");
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

  const body = await request.json();
  const parsed = createSiteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const site = await prisma.site.create({
    data: parsed.data,
  });

  await logAuditEvent({
    actorUserId: authResult.user.id,
    action: "site.create",
    entity: "site",
    entityId: site.id,
    after: site,
  });

  return NextResponse.json({ site });
};
