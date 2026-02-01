import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

export const GET = async () => {
  let dbOk = false;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  return NextResponse.json({
    ok: dbOk,
    version: env.APP_VERSION ?? "dev",
    env: env.NODE_ENV,
    time: new Date().toISOString(),
    db: { ok: dbOk },
    gitCommit: env.GIT_COMMIT ?? null,
  });
};
