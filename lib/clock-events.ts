import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";

export const clockEventSchema = z.object({
  employeeId: z.string().min(1),
  siteId: z.string().min(1),
  deviceId: z.string().min(1),
  type: z.enum(["IN", "OUT", "BREAK_START", "BREAK_END"]),
  source: z.enum(["KIOSK", "OFFLINE_SYNC", "ADMIN"]),
  occurredAt: z.coerce.date(),
  idempotencyKey: z.string().min(8),
});

export type ClockEventInput = z.infer<typeof clockEventSchema>;

export const createClockEvent = async (input: ClockEventInput) => {
  const data = clockEventSchema.parse(input);

  try {
    const event = await prisma.clockEvent.create({
      data,
    });
    return { event, created: true };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existing = await prisma.clockEvent.findUnique({
        where: { idempotencyKey: data.idempotencyKey },
      });
      if (existing) {
        return { event: existing, created: false };
      }
    }
    throw error;
  }
};
