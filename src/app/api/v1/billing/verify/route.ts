// Verifies the signature Razorpay Checkout hands back to the browser on
// successful payment, then activates the subscription. This is the fast
// path for immediate UI feedback; the webhook route is the durable,
// idempotent source of truth for the same event (network drops, the
// customer closing the tab mid-flow, etc. are all still covered there).
//
// The signature check is what stops a malicious client from just POSTing
// a fake "it succeeded" — without a valid HMAC over
// order_id|payment_id signed with our Razorpay key secret, nothing here
// is trusted.

import { createHmac } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { activatePaidSubscription } from "@/server/billing/activate";

const verifySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.companyId) {
    return NextResponse.json({ message: "Sign in to continue." }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = verifySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: "Malformed payment confirmation." }, { status: 400 });
  }
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  if (!env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json({ message: "Payments are not configured on this environment yet." }, { status: 503 });
  }

  const expectedSignature = createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return NextResponse.json({ message: "Payment signature could not be verified." }, { status: 400 });
  }

  const payment = await db.payment.findFirst({ where: { razorpayOrderId: razorpay_order_id } });
  if (!payment || payment.companyId !== session.user.companyId) {
    return NextResponse.json({ message: "Payment record not found." }, { status: 404 });
  }
  if (!payment.subscriptionId) {
    return NextResponse.json({ message: "This payment is not linked to a subscription." }, { status: 400 });
  }

  // Idempotent: if this payment was already marked PAID (e.g. the webhook
  // beat this request to it), don't re-activate or double-invoice.
  if (payment.status === "PAID") {
    return NextResponse.json({ message: "Payment already confirmed.", subscriptionId: payment.subscriptionId });
  }

  await db.payment.update({
    where: { id: payment.id },
    data: { razorpayPaymentId: razorpay_payment_id, status: "PAID", paymentDate: new Date() },
  });

  try {
    await activatePaidSubscription({
      subscriptionId: payment.subscriptionId,
      paymentId: payment.id,
      // Payment.amount is stored in rupees (Decimal(12,2)) — only the
      // Razorpay order itself is in paise (see rupeesToPaise in orders.ts).
      amountPaid: Number(payment.amount),
    });
  } catch (error) {
    console.error("Subscription activation failed after verified payment:", error);
    return NextResponse.json(
      { message: "Payment was verified but activation failed. Our team has been notified — contact support with this reference: " + payment.id },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "Payment confirmed. Your subscription is now active.", subscriptionId: payment.subscriptionId });
}
