import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { getRequestId } from "@/lib/request";

export const POST = async (request: Request) => {
  const requestId = await getRequestId();
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const key = `kiosk:handshake:${ip}`;
  const limit = rateLimit(key);

  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429 },
    );
  }

  const body = (await request.json()) as {
    deviceId?: string;
    siteId?: string;
  };

  const deviceId = body.deviceId ?? env.KIOSK_DEVICE_ID;
  const siteId = body.siteId ?? env.KIOSK_SITE_ID;

  if (!deviceId || !siteId) {
    return NextResponse.json(
      { ok: false, error: "missing_device_or_site" },
      { status: 400 },
    );
  }

  if (
    (env.KIOSK_DEVICE_ID && env.KIOSK_DEVICE_ID !== deviceId) ||
    (env.KIOSK_SITE_ID && env.KIOSK_SITE_ID !== siteId)
  ) {
    return NextResponse.json(
      { ok: false, error: "device_site_mismatch" },
      { status: 403 },
    );
  }

  const device = await prisma.device.findUnique({
    where: { id: deviceId },
  });

  if (!device || !device.active || device.siteId !== siteId) {
    logger.warn("Kiosk handshake rejected", {
      requestId,
      deviceId,
      siteId,
    });
    return NextResponse.json(
      { ok: false, error: "device_not_registered" },
      { status: 403 },
    );
  }

  await prisma.device.update({
    where: { id: deviceId },
    data: { lastSeenAt: new Date() },
  });

  logger.info("Kiosk handshake ok", { requestId, deviceId, siteId });

  return NextResponse.json({
    ok: true,
    deviceId,
    siteId,
    requestId,
    serverTime: new Date().toISOString(),
  });
};
