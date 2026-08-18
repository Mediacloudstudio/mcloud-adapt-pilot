import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requestPasswordReset } from "@/server/auth/password-reset";
import { checkRateLimit, recordAttempt } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";

const schema = z.object({ email: z.string().email() });

const GENERIC_MESSAGE = "If an account exists for that email, a reset link is on its way.";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  const ipLimit = await checkRateLimit(`forgot-password:ip:${ip}`, {
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (ipLimit.blocked) {
    // Even when rate-limited, return the generic message — an attacker
    // watching response codes shouldn't be able to distinguish
    // "rate limited" from "email doesn't exist" from "email sent".
    return NextResponse.json({ message: GENERIC_MESSAGE });
  }

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: GENERIC_MESSAGE });
  }

  const emailLimit = await checkRateLimit(`forgot-password:email:${parsed.data.email.toLowerCase()}`, {
    maxAttempts: 5,
    windowMs: 60 * 60 * 1000,
  });

  await recordAttempt(`forgot-password:ip:${ip}`);

  if (!emailLimit.blocked) {
    await recordAttempt(`forgot-password:email:${parsed.data.email.toLowerCase()}`);
    await requestPasswordReset(parsed.data.email).catch((error) => {
      console.error("Password reset request failed:", error);
    });
  }

  return NextResponse.json({ message: GENERIC_MESSAGE });
}
