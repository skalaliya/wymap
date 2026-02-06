import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { getRequestId } from "@/lib/request";
import { createHash } from "crypto";
import { resolveDeviceByRef, resolveSiteByRef } from "@/lib/kiosk-refs";

const EMPLOYEE_CACHE_CAP = 2000;
type HandshakeBody = {
  deviceId?: string;
  siteId?: string;
  employeesVersion?: string;
};

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

  let body: HandshakeBody = {};

  try {
    const parsed = await request.json();
    if (parsed && typeof parsed === "object") {
      body = parsed as HandshakeBody;
    }
  } catch {
    body = {};
  }

  const deviceRef = (body.deviceId ?? env.KIOSK_DEVICE_ID ?? "").trim();
  const siteRef = (body.siteId ?? env.KIOSK_SITE_ID ?? "").trim();
  const clientVersion = body.employeesVersion ?? null;

  if (!deviceRef || !siteRef) {
    return NextResponse.json(
      { ok: false, error: "missing_device_or_site" },
      { status: 400 },
    );
  }

  const [device, site, configuredDevice, configuredSite] = await Promise.all([
    resolveDeviceByRef(deviceRef),
    resolveSiteByRef(siteRef),
    env.KIOSK_DEVICE_ID ? resolveDeviceByRef(env.KIOSK_DEVICE_ID) : Promise.resolve(null),
    env.KIOSK_SITE_ID ? resolveSiteByRef(env.KIOSK_SITE_ID) : Promise.resolve(null),
  ]);

  const requestedSiteMatchesDevice =
    siteRef === device?.siteId || site?.id === device?.siteId;

  if (!device || !device.active || !requestedSiteMatchesDevice) {
    logger.warn("Kiosk handshake rejected", {
      requestId,
      deviceRef,
      siteRef,
    });
    return NextResponse.json(
      { ok: false, error: "device_not_registered" },
      { status: 403 },
    );
  }

  if (
    (env.KIOSK_DEVICE_ID && (!configuredDevice || configuredDevice.id !== device.id)) ||
    (env.KIOSK_SITE_ID && (!configuredSite || configuredSite.id !== device.siteId))
  ) {
    return NextResponse.json(
      { ok: false, error: "device_site_mismatch" },
      { status: 403 },
    );
  }

  await prisma.device.update({
    where: { id: device.id },
    data: { lastSeenAt: new Date() },
  });

  // Fetch active employees with badges for cache
  const employeeCount = await prisma.employee.count({
    where: { status: "ACTIVE", badgeId: { not: null } },
  });

  let employees: { badgeId: string; employeeId: string; displayName: string }[] | null = null;
  let employeesVersion: string | null = null;

  if (employeeCount <= EMPLOYEE_CACHE_CAP) {
    const rawEmployees = await prisma.employee.findMany({
      where: { status: "ACTIVE", badgeId: { not: null } },
      select: { id: true, name: true, badgeId: true, updatedAt: true },
      orderBy: { badgeId: "asc" },
    });

    // Compute version hash from employee data
    const versionData = rawEmployees
      .map((e) => `${e.id}:${e.badgeId}:${e.updatedAt.getTime()}`)
      .join("|");
    employeesVersion = createHash("sha256").update(versionData).digest("hex").slice(0, 16);

    // Only send employees if version changed
    if (clientVersion !== employeesVersion) {
      employees = rawEmployees.map((e) => ({
        badgeId: e.badgeId as string,
        employeeId: e.id,
        displayName: e.name,
      }));
    }
  }

  logger.info("Kiosk handshake ok", {
    requestId,
    deviceId: device.id,
    siteId: device.siteId,
    employeeCount,
    cacheVersion: employeesVersion,
    cacheIncluded: employees !== null,
  });

  return NextResponse.json({
    ok: true,
    deviceId: device.id,
    siteId: device.siteId,
    requestId,
    serverTime: new Date().toISOString(),
    employeesVersion,
    employeeCount,
    employees,
  });
};
