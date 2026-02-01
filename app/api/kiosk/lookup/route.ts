import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export const POST = async (request: Request) => {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const key = `kiosk:lookup:${ip}`;
  const limit = rateLimit(key);

  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429 },
    );
  }

  const body = (await request.json()) as { badgeId?: string };
  if (!body.badgeId) {
    return NextResponse.json(
      { ok: false, error: "missing_badge" },
      { status: 400 },
    );
  }

  const employee = await prisma.employee.findFirst({
    where: { badgeId: body.badgeId, status: "ACTIVE" },
  });

  if (!employee) {
    return NextResponse.json(
      { ok: false, error: "not_found" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    employeeId: employee.id,
    employeeName: employee.name,
  });
};
