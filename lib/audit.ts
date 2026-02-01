import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { getRequestId } from "@/lib/request";

type AuditPayload = {
  actorUserId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
};

const sanitize = (value: unknown): Prisma.InputJsonValue => {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item)) as Prisma.InputJsonValue;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [key, sanitize(val)]),
    ) as Prisma.InputJsonValue;
  }
  if (value === null) {
    return Prisma.JsonNull as unknown as Prisma.InputJsonValue;
  }
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  return String(value);
};

export const logAuditEvent = async ({
  actorUserId,
  action,
  entity,
  entityId,
  before,
  after,
}: AuditPayload) => {
  const headerList = await headers();
  const requestId = await getRequestId();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = headerList.get("user-agent") ?? null;

  await prisma.auditLog.create({
    data: {
      actorUserId: actorUserId ?? null,
      action,
      entity,
      entityId: entityId ?? null,
      before: before ? sanitize(before) : undefined,
      after: after ? sanitize(after) : undefined,
      ip,
      userAgent,
      createdAt: new Date(),
    },
  });

  return requestId;
};
