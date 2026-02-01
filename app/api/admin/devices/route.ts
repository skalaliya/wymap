import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { verifyCsrfToken } from "@/lib/csrf";
import { logAuditEvent } from "@/lib/audit";
import { enforceRateLimit } from "@/lib/api-rate-limit";
import { z } from "zod";

const createDeviceSchema = z.object({
  name: z.string().min(1),
  siteId: z.string().min(1),
  active: z.boolean().optional(),
});

export const GET = async (request: Request) => {
  const rateResponse = enforceRateLimit(request, "admin:devices:get");
  if (rateResponse) {
    return rateResponse;
  }

  const authResult = await requireApiRole(["ADMIN", "MANAGER", "SUPERVISOR"]);
  if (!authResult.ok) {
    return NextResponse.json({}, { status: authResult.status });
  }

  const devices = await prisma.device.findMany({
    orderBy: { createdAt: "desc" },
    include: { site: true },
  });

  return NextResponse.json({ devices });
};

export const POST = async (request: Request) => {
  const rateResponse = enforceRateLimit(request, "admin:devices:post");
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
  const parsed = createDeviceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const site = await prisma.site.findUnique({
    where: { id: parsed.data.siteId },
  });
  if (!site) {
    return NextResponse.json({ error: "site_not_found" }, { status: 404 });
  }

  const device = await prisma.device.create({
    data: parsed.data,
  });

  await logAuditEvent({
    actorUserId: authResult.user.id,
    action: "device.create",
    entity: "device",
    entityId: device.id,
    after: device,
  });

  return NextResponse.json({ device });
};
