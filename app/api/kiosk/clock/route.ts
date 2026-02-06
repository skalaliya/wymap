import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { getRequestId } from "@/lib/request";
import { clockEventSchema, createClockEvent } from "@/lib/clock-events";

export const POST = async (request: Request) => {
  const requestId = await getRequestId();
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const key = `kiosk:clock:${ip}`;
  const limit = rateLimit(key);

  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_payload" },
      { status: 400 },
    );
  }
  const parsed = clockEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_payload" },
      { status: 400 },
    );
  }

  const { deviceId, siteId, employeeId, source } = parsed.data;

  if (
    (env.KIOSK_DEVICE_ID && env.KIOSK_DEVICE_ID !== deviceId) ||
    (env.KIOSK_SITE_ID && env.KIOSK_SITE_ID !== siteId)
  ) {
    return NextResponse.json(
      { ok: false, error: "device_site_mismatch" },
      { status: 403 },
    );
  }

  const [device, employee] = await Promise.all([
    prisma.device.findUnique({ where: { id: deviceId } }),
    prisma.employee.findUnique({ where: { id: employeeId } }),
  ]);

  if (!device || !device.active || device.siteId !== siteId) {
    return NextResponse.json(
      { ok: false, error: "device_not_registered" },
      { status: 403 },
    );
  }

  if (!employee || employee.status !== "ACTIVE") {
    return NextResponse.json(
      { ok: false, error: "employee_not_active" },
      { status: 403 },
    );
  }

  if (!["KIOSK", "OFFLINE_SYNC"].includes(source)) {
    return NextResponse.json(
      { ok: false, error: "invalid_source" },
      { status: 400 },
    );
  }

  await prisma.device.update({
    where: { id: deviceId },
    data: { lastSeenAt: new Date() },
  });

  const { event, created } = await createClockEvent(parsed.data);

  logger.info("Clock event recorded", {
    requestId,
    eventId: event.id,
    created,
    employeeId,
  });

  return NextResponse.json({
    ok: true,
    created,
    event,
    requestId,
  });
};
