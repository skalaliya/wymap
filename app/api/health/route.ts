import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

const HEALTH_ENV_KEYS = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "AUTH_ADMIN_EMAIL",
  "AUTH_ADMIN_PASSWORD",
  "KIOSK_SITE_ID",
  "KIOSK_DEVICE_ID",
] as const;

const hasEnvValue = (key: (typeof HEALTH_ENV_KEYS)[number]): boolean => {
  const value = process.env[key];
  return typeof value === "string" && value.trim().length > 0;
};

export const GET = async () => {
  let dbOk = false;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  const envStatus = Object.fromEntries(
    HEALTH_ENV_KEYS.map((key) => [key, hasEnvValue(key)]),
  );

  return NextResponse.json(
    {
      ok: dbOk,
      db: { ok: dbOk },
      env: envStatus,
      version: env.APP_VERSION ?? "dev",
      gitCommit: env.GIT_COMMIT ?? null,
      time: new Date().toISOString(),
    },
    { status: dbOk ? 200 : 503 },
  );
};
