import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

export const enforceRateLimit = (request: Request, prefix: string) => {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const key = `${prefix}:${ip}`;
  const limit = rateLimit(key);

  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429 },
    );
  }

  return null;
};
