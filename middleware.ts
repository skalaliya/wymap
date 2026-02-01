import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { REQUEST_ID_HEADER } from "@/lib/request";

export const middleware = (request: NextRequest) => {
  const requestId =
    request.headers.get(REQUEST_ID_HEADER) ?? crypto.randomUUID();
  const response = NextResponse.next();
  response.headers.set(REQUEST_ID_HEADER, requestId);
  response.headers.set("x-pathname", request.nextUrl.pathname);
  return response;
};

export const config = {
  matcher: ["/api/:path*", "/admin/:path*"],
};
