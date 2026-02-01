import { cookies, headers } from "next/headers";
import { randomUUID } from "crypto";

export const CSRF_COOKIE = "wymap-csrf";

export const issueCsrfToken = async () => {
  const token = randomUUID();
  const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE, token, {
    httpOnly: false,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return token;
};

export const verifyCsrfToken = async () => {
  const headerList = await headers();
  const cookieStore = await cookies();
  const token = headerList.get("x-csrf-token");
  const cookie = cookieStore.get(CSRF_COOKIE)?.value;
  if (!token || !cookie || token !== cookie) {
    throw new Error("Invalid CSRF token");
  }
};
