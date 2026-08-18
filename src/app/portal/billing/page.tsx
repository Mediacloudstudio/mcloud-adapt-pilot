import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import { ButtonLink } from "@/components/ui/button";
import { formatPlanPrice } from "@/lib/plans";
import { getPortalContext } from "@/server/portal/context";
import { getActiveSubscription, getPayments } from "@/server/portal/queries";
import { CancelSubscriptionButton } from "@/components/portal/cancel-subscription-button";

export const metadata: Metadata = { title: "Billing" };
export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const { companyId } = await getPortalContext();
  const [subscription, payments] = await Promise.all([getActiveSubscription(companyId), getPayments(companyId)]);
  const lastPayment = payments.find((p) => p.status === "PAID");

  return (
    <>
      <PageHeader
        title="Billing"
        description="Your plan, payment history and invoices."
        actions={
          <>
            <ButtonLink href="/pricing" variant="outline" size="md">
              Upgrade Plan
            </ButtonLink>
            <ButtonLink href="/portal/billing/invoices" size="md">
              View Invoices
            </ButtonLink>
          </>
        }
      />

      {subscription && (
        <div className="rounded-xl2 border border-ink-100 bg-white p-6 shadow-card">
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <dt className="text-xs text-ink-500">Current Plan</dt>
              <dd className="text-sm font-medium text-ink-800">{subscription.plan.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">Plan Price</dt>
              <dd className="text-sm font-medium text-ink-800">₹{formatPlanPrice(subscription.plan.price)}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">Subscription Status</dt>
              <dd><StatusChip status={subscription.status} /></dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">Payment Gateway</dt>
              <dd className="text-sm font-medium text-ink-800">Razorpay</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">Last Payment</dt>
              <dd className="text-sm font-medium text-ink-800">
                {lastPayment ? formatDate(lastPayment.createdAt) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">Next Payment / Renewal</dt>
              <dd className="text-sm font-medium text-ink-800">
                {subscription.nextBillingDate ? formatDate(subscription.nextBillingDate) : "—"}
              </dd>
            </div>
          </dl>
          {!subscription.cancelAtPeriodEnd && (
            <div className="mt-6 border-t border-ink-100 pt-6">
              <CancelSubscriptionButton />
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl2 border border-ink-100 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-100 bg-ink-50/60 text-left text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Razorpay Payment ID</th>
              <th className="px-5 py-3 font-medium">Plan</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Invoice</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-ink-500">
                  No payments yet.
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-5 py-3 text-ink-600">{formatDate(payment.createdAt)}</td>
                  <td className="px-5 py-3 font-mono text-xs text-ink-500">{payment.razorpayPaymentId ?? "—"}</td>
                  <td className="px-5 py-3 text-ink-600">{payment.subscription?.plan.name ?? "—"}</td>
                  <td className="px-5 py-3 font-medium text-ink-900">
                    ₹{formatPlanPrice(payment.amount)} {payment.currency}
                  </td>
                  <td className="px-5 py-3">
                    <StatusChip status={payment.status} />
                  </td>
                  <td className="px-5 py-3">
                    {payment.invoice ? (
                      <ButtonLink href="/portal/billing/invoices" variant="ghost" size="md">
                        {payment.invoice.invoiceNumber}
                      </ButtonLink>
                    ) : (
                      <span className="text-ink-400">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
