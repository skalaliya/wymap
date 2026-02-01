import { headers } from "next/headers";

export const REQUEST_ID_HEADER = "x-request-id";

const generateRequestId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `req_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

export const getRequestId = async () => {
  const headerList = await headers();
  return headerList.get(REQUEST_ID_HEADER) ?? generateRequestId();
};
