import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { enforceRateLimit } from "@/lib/api-rate-limit";

type Shift = {
  start: string;
  end: string | null;
  minutes: number;
};

export const GET = async (request: Request) => {
  const rateResponse = enforceRateLimit(request, "admin:timesheets:get");
  if (rateResponse) {
    return rateResponse;
  }

  const authResult = await requireApiRole(["ADMIN", "MANAGER", "SUPERVISOR"]);
  if (!authResult.ok) {
    return NextResponse.json({}, { status: authResult.status });
  }

  const url = new URL(request.url);
  const dateParam = url.searchParams.get("date");
  const filter = url.searchParams.get("filter");
  const page = Number(url.searchParams.get("page") ?? "1");
  const pageSize = Number(url.searchParams.get("pageSize") ?? "20");

  const date = dateParam ? new Date(dateParam) : new Date();
  date.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const employees = await prisma.employee.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  const events: Array<{
    id: string;
    employeeId: string;
    type: "IN" | "OUT" | "BREAK_START" | "BREAK_END";
    occurredAt: Date;
  }> = await prisma.clockEvent.findMany({
    where: { occurredAt: { gte: date, lte: end } },
    orderBy: { occurredAt: "asc" },
  });

  const byEmployee = events.reduce<Record<string, typeof events>>((acc, event) => {
    acc[event.employeeId] = acc[event.employeeId] ?? [];
    acc[event.employeeId].push(event);
    return acc;
  }, {});

  const rows = employees.map((employee) => {
    const employeeEvents = byEmployee[employee.id] ?? [];
    const shifts: Shift[] = [];
    let openShiftStartMs: number | null = null;
    let inCount = 0;
    let outCount = 0;

    employeeEvents.forEach((event) => {
      if (event.type === "IN") {
        inCount += 1;
        if (!openShiftStartMs) {
          openShiftStartMs = event.occurredAt.getTime();
        }
      }
      if (event.type === "OUT") {
        outCount += 1;
        if (openShiftStartMs) {
          const minutes =
            (event.occurredAt.getTime() - openShiftStartMs) / 1000 / 60;
          shifts.push({
            start: new Date(openShiftStartMs).toISOString(),
            end: event.occurredAt.toISOString(),
            minutes: Math.max(0, Math.round(minutes)),
          });
          openShiftStartMs = null;
        }
      }
    });

    if (openShiftStartMs) {
      shifts.push({
        start: new Date(openShiftStartMs).toISOString(),
        end: null,
        minutes: 0,
      });
    }

    const anomalies: string[] = [];
    if (inCount > outCount) anomalies.push("Missing OUT");
    if (inCount > 1) anomalies.push("Multiple IN");
    if (outCount > 1) anomalies.push("Multiple OUT");

    const lastEvent = employeeEvents[employeeEvents.length - 1];
    const isOnsite = lastEvent?.type === "IN";

    const suggestedEventId =
      employeeEvents.find((event) => event.type === "IN")?.id ??
      employeeEvents[0]?.id ??
      null;

    return {
      employee,
      shifts,
      anomalies,
      isOnsite,
      suggestedEventId,
    };
  });

  const filtered = rows.filter((row) => {
    if (filter === "onsite") return row.isOnsite;
    if (filter === "missing-out") return row.anomalies.includes("Missing OUT");
    return true;
  });

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return NextResponse.json({
    rows: paged,
    page,
    pageSize,
    total: filtered.length,
    date: date.toISOString(),
  });
};
