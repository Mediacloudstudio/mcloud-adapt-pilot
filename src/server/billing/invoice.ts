// Invoice number generation + creation. The prefix is admin-configurable
// (AppSetting.invoicePrefix, PART 32) so Finance can change it without a
// deploy; the running sequence is scoped per calendar year so numbers
// reset cleanly each fiscal year the way most Indian invoicing schemes
// expect (e.g. MCAP-2026-000123).

import type { Prisma } from "@prisma/client";
import { splitInclusiveTotal } from "@/lib/gst";

export async function nextInvoiceNumber(tx: Prisma.TransactionClient): Promise<string> {
  const setting = await tx.appSetting.findUnique({ where: { key: "invoicePrefix" } });
  const prefix = typeof setting?.value === "string" && setting.value.trim() ? setting.value.trim() : "MCAP";
  const year = new Date().getFullYear();

  const countThisYear = await tx.invoice.count({
    where: { invoiceNumber: { startsWith: `${prefix}-${year}-` } },
  });

  const sequence = String(countThisYear + 1).padStart(6, "0");
  return `${prefix}-${year}-${sequence}`;
}

export async function createInvoiceForPayment(
  tx: Prisma.TransactionClient,
  params: {
    companyId: string;
    subscriptionId?: string | null;
    paymentId: string;
    amountPaid: number; // treated as GST-inclusive total charged via Razorpay
    customerState?: string | null;
    customerGstin?: string | null;
    billingPeriodStart?: Date | null;
    billingPeriodEnd?: Date | null;
  }
) {
  const { subtotal, taxAmount, breakdown } = await splitInclusiveTotal(params.amountPaid, params.customerState);
  const invoiceNumber = await nextInvoiceNumber(tx);

  return tx.invoice.create({
    data: {
      companyId: params.companyId,
      subscriptionId: params.subscriptionId ?? undefined,
      paymentId: params.paymentId,
      invoiceNumber,
      customerGstin: params.customerGstin ?? undefined,
      billingPeriodStart: params.billingPeriodStart ?? undefined,
      billingPeriodEnd: params.billingPeriodEnd ?? undefined,
      subtotal,
      taxAmount,
      taxBreakdown: breakdown,
      total: params.amountPaid,
      status: "ISSUED",
    },
  });
}
