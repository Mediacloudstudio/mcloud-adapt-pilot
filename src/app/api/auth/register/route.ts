import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { registerCustomer, EmailAlreadyRegisteredError } from "@/server/auth/register";
import { checkRateLimit, recordAttempt } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";

const registerSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().min(6).max(30),
  companyName: z.string().min(1).max(200),
  country: z.string().min(1).max(100),
  password: z.string().min(8).max(200),
  confirmPassword: z.string(),
  acceptTerms: z.literal(true),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimitKey = `register:ip:${ip}`;

  // Cheap abuse guard: 10 registration attempts per hour per IP. This is
  // intentionally generous — it's here to blunt scripted account-creation
  // floods, not to get in a real signing-up team's way.
  const limit = await checkRateLimit(rateLimitKey, { maxAttempts: 10, windowMs: 60 * 60 * 1000 });
  if (limit.blocked) {
    return NextResponse.json(
      { message: "Too many registration attempts. Please try again later." },
      { status: 429 }
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ message: "Please check the form and try again." }, { status: 400 });
  }

  if (parsed.data.password !== parsed.data.confirmPassword) {
    return NextResponse.json({ message: "Passwords do not match." }, { status: 400 });
  }

  await recordAttempt(rateLimitKey);

  try {
    await registerCustomer(parsed.data);
  } catch (error) {
    if (error instanceof EmailAlreadyRegisteredError) {
      // Deliberately vague to avoid making this endpoint a clean "is this
      // email already registered" oracle, while still telling a genuine
      // customer enough to know to try logging in instead.
      return NextResponse.json(
        { message: "If this email can be registered, you'll receive a verification email shortly." },
        { status: 200 }
      );
    }
    console.error("Registration failed:", error);
    return NextResponse.json({ message: "Something went wrong. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ message: "Account created. Check your email to verify it." }, { status: 201 });
}
