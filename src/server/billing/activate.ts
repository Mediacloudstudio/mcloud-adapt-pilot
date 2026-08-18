// Shared "a payment was captured" activation logic. Called from BOTH the
// synchronous checkout-verify route (fast UI feedback right after
// Razorpay Checkout succeeds) and the webhook handler (the durable,
// idempotent source of truth). Keeping this in one place means the two
// entry points can never drift out of sync with each other.
//
// Idempotency: callers must check/record the RazorpayEvent or Payment
// status themselves before calling this — this function assumes it's
// safe to run, but is itself written so a second accidental call is
// harmless (upserts license instead of always creating a new one).

import { db } from "@/lib/db";
import { generateLicenseKey } from "@/lib/license-key";
import { createInvoiceForPayment } from "@/server/billing/invoice";
import { recordAuditLog } from "@/server/audit/log";

const BILLING_PERIOD_DAYS: Record<string, number> = {
  MONTHLY: 30,
  ANNUAL: 365,
  ONE_TIME: 3650, // effectively perpetual; still trackable/expirable if ever needed
  CUSTOM: 365,
};

export async function activatePaidSubscription(params: {
  subscriptionId: string;
  paymentId: string;
  amountPaid: number; // rupees, GST-inclusive, what Razorpay actually captured
}) {
  const subscription = await db.subscription.findUniqueOrThrow({
    where: { id: params.subscriptionId },
    include: { plan: true, company: true },
  });

  const now = new Date();
  const periodDays = BILLING_PERIOD_DAYS[subscription.plan.billingFrequency] ?? 365;
  const nextBillingDate = new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000);

  const result = await db.$transaction(async (tx) => {
    await tx.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "ACTIVE",
        startDate: subscription.startDate ?? now,
        nextBillingDate,
        cancelAtPeriodEnd: false,
      },
    });

    // One license per company. If it already exists (renewal / plan
    // change), just re-point it at the current subscription and make
    // sure it's ACTIVE again — never issue a second key for the same
    // customer.
    let license = await tx.license.findFirst({ where: { companyId: subscription.companyId } });

    if (!license) {
      // licenseKeyHash/displayKey collisions are cryptographically
      // negligible (32^16 keyspace) — not worth a transaction-unsafe
      // retry loop (Postgres aborts the whole transaction on the first
      // unique-constraint error, so a retry would need a savepoint to
      // actually work). If it ever happens, the transaction fails
      // cleanly and the payment can be re-processed.
      const { displayKey, keyHash } = generateLicenseKey();
      license = await tx.license.create({
        data: {
          companyId: subscription.companyId,
          subscriptionId: subscription.id,
          licenseKeyHash: keyHash,
          displayKey,
          status: "ACTIVE",
        },
      });
      await tx.licenseEvent.create({ data: { licenseId: license.id, event: "ACTIVATED", detail: "Issued on payment capture" } });
    } else {
      license = await tx.license.update({
        where: { id: license.id },
        data: { subscriptionId: subscription.id, status: "ACTIVE" },
      });
      await tx.licenseEvent.create({ data: { licenseId: license.id, event: "REACTIVATED", detail: "Reactivated on payment capture" } });
    }

    const invoice = await createInvoiceForPayment(tx, {
      companyId: subscription.companyId,
      subscriptionId: subscription.id,
      paymentId: params.paymentId,
      amountPaid: params.amountPaid,
      customerState: subscription.company.state,
      customerGstin: subscription.company.gstin,
      billingPeriodStart: now,
      billingPeriodEnd: nextBillingDate,
    });

    return { license, invoice };
  });

  await recordAuditLog({
    companyId: subscription.companyId,
    action: "SUBSCRIPTION_ACTIVATED",
    entity: "Subscription",
    entityId: subscription.id,
    newValue: { status: "ACTIVE", nextBillingDate, planId: subscription.planId },
  });

  return result;
}
