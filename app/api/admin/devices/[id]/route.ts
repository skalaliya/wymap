import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { verifyCsrfToken } from "@/lib/csrf";
import { logAuditEvent } from "@/lib/audit";
import { enforceRateLimit } from "@/lib/api-rate-limit";
import { z } from "zod";

const updateDeviceSchema = z.object({
  name: z.string().min(1).optional(),
  siteId: z.string().min(1).optional(),
  active: z.boolean().optional(),
});

export const PATCH = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const rateResponse = enforceRateLimit(request, "admin:devices:patch");
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
  const parsed = updateDeviceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  if (parsed.data.siteId) {
    const site = await prisma.site.findUnique({
      where: { id: parsed.data.siteId },
    });
    if (!site) {
      return NextResponse.json({ error: "site_not_found" }, { status: 404 });
    }
  }

  const existing = await prisma.device.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const device = await prisma.device.update({
    where: { id },
    data: parsed.data,
  });

  await logAuditEvent({
    actorUserId: authResult.user.id,
    action: "device.update",
    entity: "device",
    entityId: device.id,
    before: existing,
    after: device,
  });

  return NextResponse.json({ device });
};
