import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { enforceRateLimit } from "@/lib/api-rate-limit";
import { toCsv } from "@/lib/csv";

export const GET = async (request: Request) => {
  const rateResponse = enforceRateLimit(request, "admin:reports:get");
  if (rateResponse) {
    return rateResponse;
  }

  const authResult = await requireApiRole(["ADMIN", "MANAGER"]);
  if (!authResult.ok) {
    return NextResponse.json({}, { status: authResult.status });
  }

  const url = new URL(request.url);
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");
  const employeeId = url.searchParams.get("employeeId");
  const siteId = url.searchParams.get("siteId");

  const where = {
    ...(employeeId ? { employeeId } : {}),
    ...(siteId ? { siteId } : {}),
    ...(start || end
      ? {
          occurredAt: {
            ...(start ? { gte: new Date(start) } : {}),
            ...(end ? { lte: new Date(end) } : {}),
          },
        }
      : {}),
  };

  const events = await prisma.clockEvent.findMany({
    where,
    orderBy: { occurredAt: "asc" },
    include: { employee: true, site: true, device: true },
  });

  const rows = [
    [
      "Employee",
      "EmployeeId",
      "Site",
      "Device",
      "Type",
      "OccurredAt",
      "Source",
    ],
    ...events.map((event) => [
      event.employee.name,
      event.employeeId,
      event.site.name,
      event.device.name,
      event.type,
      event.occurredAt.toISOString(),
      event.source,
    ]),
  ];

  const csv = toCsv(rows);
  const csv = rows.map((row) => row.join(",")).join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=\"wymap-report.csv\"",
    },
  });
};
