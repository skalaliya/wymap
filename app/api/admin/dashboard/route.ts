import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { enforceRateLimit } from "@/lib/api-rate-limit";

export const GET = async (request: Request) => {
  const rateResponse = enforceRateLimit(request, "admin:dashboard:get");
  if (rateResponse) {
    return rateResponse;
  }

  const authResult = await requireApiRole(["ADMIN", "MANAGER", "SUPERVISOR"]);
  if (!authResult.ok) {
    return NextResponse.json({}, { status: authResult.status });
  }

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const [eventsToday, devices] = await Promise.all([
    prisma.clockEvent.findMany({
      where: { occurredAt: { gte: startOfDay } },
      include: { employee: true },
      orderBy: { occurredAt: "asc" },
    }),
    prisma.device.findMany({ include: { site: true } }),
  ]);

  const onsite = new Set<string>();
  const missingCheckout = new Set<string>();
  const activityCount = eventsToday.length;

  eventsToday.forEach((event) => {
    if (event.type === "IN") {
      onsite.add(event.employeeId);
      missingCheckout.add(event.employeeId);
    }
    if (event.type === "OUT") {
      onsite.delete(event.employeeId);
      missingCheckout.delete(event.employeeId);
    }
  });

  const offlineDevices = devices.filter((device) => {
    if (!device.lastSeenAt) {
      return true;
    }
    const minutesSince =
      (Date.now() - device.lastSeenAt.getTime()) / 1000 / 60;
    return minutesSince > 10;
  });

  return NextResponse.json({
    activityCount,
    onsiteCount: onsite.size,
    missingCheckoutCount: missingCheckout.size,
    offlineDevices: offlineDevices.map((device) => ({
      id: device.id,
      name: device.name,
      site: device.site.name,
      lastSeenAt: device.lastSeenAt?.toISOString() ?? null,
    })),
  });
};
