import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { resetPassword } from "@/server/auth/password-reset";
import { checkRateLimit, recordAttempt } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";

const schema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8).max(200),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = await checkRateLimit(`reset-password:ip:${ip}`, { maxAttempts: 15, windowMs: 60 * 60 * 1000 });
  if (limit.blocked) {
    return NextResponse.json({ message: "Too many attempts. Please try again later." }, { status: 429 });
  }
  await recordAttempt(`reset-password:ip:${ip}`);

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 }
    );
  }

  const result = await resetPassword(parsed.data.token, parsed.data.password);

  switch (result.status) {
    case "success":
      return NextResponse.json({ message: "Password updated. You can now log in." });
    case "expired":
      return NextResponse.json({ message: "This reset link has expired. Request a new one." }, { status: 400 });
    case "already-used":
      return NextResponse.json({ message: "This reset link has already been used." }, { status: 400 });
    case "invalid":
    default:
      return NextResponse.json({ message: "This reset link is invalid." }, { status: 400 });
  }
}
