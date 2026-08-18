// Razorpay order creation. This is the ONLY place the desktop-facing
// "how much does this customer owe" decision gets made — the price
// always comes from the Plan row in our own database, never from
// anything the browser sends (PART 53/66). The client only ever tells
// us *which* plan was picked; we look up what that plan currently costs.

import { db } from "@/lib/db";
import { getRazorpayClient, rupeesToPaise } from "@/lib/razorpay";
import { calculateGst } from "@/lib/gst";

export class PlanNotPurchasableError extends Error {
  constructor() {
    super("This plan is not currently available for purchase.");
    this.name = "PlanNotPurchasableError";
  }
}

export async function createCheckoutOrder(params: { companyId: string; planId: string }) {
  const [company, plan] = await Promise.all([
    db.company.findUniqueOrThrow({ where: { id: params.companyId } }),
    db.plan.findUniqueOrThrow({ where: { id: params.planId } }),
  ]);

  if (plan.status !== "ACTIVE") {
    throw new PlanNotPurchasableError();
  }

  // Company-level pricing override (PART 46) always wins over the plan's
  // list price when one exists.
  const override = await db.companyPlanOverride.findUnique({ where: { companyId: company.id } });
  const listPrice = Number(plan.price);
  const priceInRupees = override?.customPrice != null ? Number(override.customPrice) : listPrice;

  // The price stored on the Plan is the pre-tax list price; GST is added
  // on top for the amount actually charged via Razorpay.
  const { taxAmount } = await calculateGst(priceInRupees, company.state);
  const totalPayable = round2(priceInRupees + taxAmount);

  // Find or create the customer's pending subscription row for this plan.
  let subscription = await db.subscription.findFirst({
    where: { companyId: company.id, status: { in: ["PENDING_PAYMENT", "TRIAL"] } },
  });

  if (subscription) {
    subscription = await db.subscription.update({
      where: { id: subscription.id },
      data: { planId: plan.id, status: "PENDING_PAYMENT" },
    });
  } else {
    subscription = await db.subscription.create({
      data: { companyId: company.id, planId: plan.id, status: "PENDING_PAYMENT" },
    });
  }

  const razorpay = getRazorpayClient();
  const order = await razorpay.orders.create({
    amount: rupeesToPaise(totalPayable),
    currency: plan.currency || "INR",
    receipt: `sub_${subscription.id}`.slice(0, 40),
    notes: { companyId: company.id, subscriptionId: subscription.id, planId: plan.id },
  });

  const payment = await db.payment.create({
    data: {
      companyId: company.id,
      subscriptionId: subscription.id,
      razorpayOrderId: order.id,
      amount: totalPayable,
      currency: plan.currency || "INR",
      status: "PENDING",
    },
  });

  return {
    orderId: order.id,
    amount: rupeesToPaise(totalPayable),
    currency: plan.currency || "INR",
    subscriptionId: subscription.id,
    paymentId: payment.id,
    planName: plan.name,
    companyName: company.companyName,
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
