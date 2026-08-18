// Starts a Razorpay checkout for the signed-in customer's company. The
// only client input is which plan they picked — price, tax, and even
// which company is paying are all re-derived server-side from the
// session, never trusted from the request body (PART 53/66).

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { env } from "@/lib/env";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { createCheckoutOrder, PlanNotPurchasableError } from "@/server/billing/orders";

const checkoutSchema = z.object({ planId: z.string().min(1) });

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.companyId) {
    return NextResponse.json({ message: "Sign in to continue." }, { status: 401 });
  }

  if (!isRazorpayConfigured()) {
    return NextResponse.json(
      { message: "Payments are not configured on this environment yet. Set RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET." },
      { status: 503 }
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: "Select a plan to continue." }, { status: 400 });
  }

  try {
    const order = await createCheckoutOrder({ companyId: session.user.companyId, planId: parsed.data.planId });
    return NextResponse.json({
      ...order,
      keyId: env.RAZORPAY_KEY_ID, // public key — safe to expose, Checkout.js requires it client-side
    });
  } catch (error) {
    if (error instanceof PlanNotPurchasableError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    console.error("Checkout order creation failed:", error);
    return NextResponse.json({ message: "Could not start checkout. Please try again." }, { status: 500 });
  }
}
