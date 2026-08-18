// Razorpay webhook receiver — the durable, idempotent source of truth
// for payment/refund/subscription lifecycle events (PART 29). Runs
// independently of whether the customer's browser ever calls
// /api/v1/billing/verify (they might close the tab, lose network, etc.
// right after paying — Razorpay still tells us here).
//
// Idempotency: every inbound event carries a unique
// `x-razorpay-event-id` header. We record one RazorpayEvent row per ID
// before doing any side effects; if we've already seen that ID, we
// acknowledge with 200 and do nothing else, so Razorpay's automatic
// retries can never double-activate a subscription or double-issue an
// invoice.

import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { activatePaidSubscription } from "@/server/billing/activate";
import { recordAuditLog } from "@/server/audit/log";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");
  const eventId = request.headers.get("x-razorpay-event-id");

  if (!env.RAZORPAY_WEBHOOK_SECRET) {
    console.error("Razorpay webhook received but RAZORPAY_WEBHOOK_SECRET is not configured.");
    return NextResponse.json({ message: "Webhook not configured." }, { status: 503 });
  }
  if (!signature || !eventId) {
    return NextResponse.json({ message: "Missing signature or event id." }, { status: 400 });
  }

  const expected = createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest("hex");
  const signaturesMatch =
    expected.length === signature.length && timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  if (!signaturesMatch) {
    return NextResponse.json({ message: "Invalid signature." }, { status: 400 });
  }

  let payload: RazorpayWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  // Idempotency gate: try to claim this event ID. If it already exists,
  // another delivery (a Razorpay retry) already handled — or is
  // currently handling — it.
  const existing = await db.razorpayEvent.findUnique({ where: { eventId } });
  if (existing) {
    return NextResponse.json({ message: "Already processed." });
  }

  const eventRow = await db.razorpayEvent.create({
    data: { eventId, eventType: payload.event, status: "RECEIVED" },
  });

  try {
    await handleEvent(payload);
    await db.razorpayEvent.update({ where: { id: eventRow.id }, data: { status: "PROCESSED", processedAt: new Date() } });
  } catch (error) {
    console.error(`Razorpay webhook ${payload.event} (${eventId}) failed:`, error);
    await db.razorpayEvent.update({
      where: { id: eventRow.id },
      data: { status: "FAILED", error: error instanceof Error ? error.message : "Unknown error", processedAt: new Date() },
    });
    // Still 200 — Razorpay will retry on non-2xx, but a FAILED row here
    // means the failure is visible in Admin → Audit Logs / dev logs for
    // a human to investigate rather than silently retrying forever with
    // no record.
  }

  return NextResponse.json({ message: "Received." });
}

type RazorpayWebhookPayload = {
  event: string;
  payload: {
    payment?: { entity: RazorpayPaymentEntity };
    refund?: { entity: { id: string; payment_id: string; amount: number } };
  };
};

type RazorpayPaymentEntity = {
  id: string;
  order_id: string;
  amount: number; // paise
  status: string;
  error_description?: string | null;
};

async function handleEvent(payload: RazorpayWebhookPayload) {
  switch (payload.event) {
    case "payment.captured":
      await handlePaymentCaptured(payload.payload.payment?.entity);
      return;
    case "payment.failed":
      await handlePaymentFailed(payload.payload.payment?.entity);
      return;
    case "refund.processed":
      await handleRefundProcessed(payload.payload.refund?.entity);
      return;
    default:
      // Every other event type (subscription.*, order.paid, etc.) is
      // acknowledged but intentionally a no-op today — nothing else in
      // this build depends on them yet.
      return;
  }
}

async function handlePaymentCaptured(entity: RazorpayPaymentEntity | undefined) {
  if (!entity) return;

  const payment = await db.payment.findFirst({ where: { razorpayOrderId: entity.order_id } });
  if (!payment || !payment.subscriptionId) {
    console.error(`payment.captured for unknown order ${entity.order_id}`);
    return;
  }

  if (payment.status === "PAID") return; // already handled via /verify or a prior webhook delivery

  await db.payment.update({
    where: { id: payment.id },
    data: { razorpayPaymentId: entity.id, status: "PAID", paymentDate: new Date() },
  });

  await activatePaidSubscription({
    subscriptionId: payment.subscriptionId,
    paymentId: payment.id,
    amountPaid: Number(payment.amount),
  });
}

async function handlePaymentFailed(entity: RazorpayPaymentEntity | undefined) {
  if (!entity) return;

  const payment = await db.payment.findFirst({ where: { razorpayOrderId: entity.order_id } });
  if (!payment) return;
  if (payment.status === "PAID") return; // don't downgrade an already-successful payment

  await db.payment.update({
    where: { id: payment.id },
    data: { status: "FAILED", failureReason: entity.error_description ?? "Payment failed at gateway" },
  });

  await recordAuditLog({
    companyId: payment.companyId,
    action: "PAYMENT_FAILED",
    entity: "Payment",
    entityId: payment.id,
    newValue: { reason: entity.error_description },
  });
}

async function handleRefundProcessed(entity: { id: string; payment_id: string; amount: number } | undefined) {
  if (!entity) return;

  const payment = await db.payment.findFirst({ where: { razorpayPaymentId: entity.payment_id } });
  if (!payment) return;

  const amountRupees = entity.amount / 100;

  await db.$transaction([
    db.refund.upsert({
      where: { razorpayRefundId: entity.id },
      update: { status: "PROCESSED" },
      create: { paymentId: payment.id, razorpayRefundId: entity.id, amount: amountRupees, status: "PROCESSED" },
    }),
    db.payment.update({
      where: { id: payment.id },
      data: { status: amountRupees >= Number(payment.amount) ? "REFUNDED" : "PARTIALLY_REFUNDED" },
    }),
  ]);

  await recordAuditLog({
    companyId: payment.companyId,
    action: "REFUND_PROCESSED",
    entity: "Payment",
    entityId: payment.id,
    newValue: { amount: amountRupees },
  });
}
