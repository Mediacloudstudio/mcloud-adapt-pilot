import type { NextRequest } from "next/server";

/** Best-effort client IP for rate-limiting keys. Trusts the standard proxy header set by Vercel/most reverse proxies. */
export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}
