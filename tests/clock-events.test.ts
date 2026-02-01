import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/db";
import { clockEventSchema, createClockEvent } from "@/lib/clock-events";

describe("clock event validation", () => {
  it("rejects invalid payloads", () => {
    const result = clockEventSchema.safeParse({
      employeeId: "",
      siteId: "",
      deviceId: "",
      type: "IN",
      source: "KIOSK",
      occurredAt: "not-a-date",
      idempotencyKey: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("clock event idempotency", () => {
  beforeEach(async () => {
    await prisma.correction.deleteMany();
    await prisma.clockEvent.deleteMany();
    await prisma.device.deleteMany();
    await prisma.site.deleteMany();
    await prisma.employee.deleteMany();
  });

  it("does not create duplicates for same idempotency key", async () => {
    const employee = await prisma.employee.create({
      data: { name: "Test Employee", status: "ACTIVE" },
    });
    const site = await prisma.site.create({
      data: { name: "Test Site", timeZone: "UTC" },
    });
    const device = await prisma.device.create({
      data: { name: "Test Device", siteId: site.id },
    });

    const payload = {
      employeeId: employee.id,
      siteId: site.id,
      deviceId: device.id,
      type: "IN" as const,
      source: "KIOSK" as const,
      occurredAt: new Date(),
      idempotencyKey: "idem-test-1",
    };

    const first = await createClockEvent(payload);
    const second = await createClockEvent(payload);

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    const count = await prisma.clockEvent.count();
    expect(count).toBe(1);
  });
});
