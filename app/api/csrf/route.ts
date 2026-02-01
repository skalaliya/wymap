import { NextResponse } from "next/server";
import { issueCsrfToken } from "@/lib/csrf";

export const GET = async () => {
  const token = await issueCsrfToken();
  return NextResponse.json(
    { token },
    {
      headers: { "Cache-Control": "no-store" },
    },
  );
};
