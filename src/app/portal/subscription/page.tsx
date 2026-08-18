import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import { ButtonLink } from "@/components/ui/button";
import { formatPlanPrice, billingFrequencyLabel } from "@/lib/plans";
import { getPortalContext } from "@/server/portal/context";
import { getActiveSubscription } from "@/server/portal/queries";
import { CancelSubscriptionButton } from "@/components/portal/cancel-subscription-button";

export const metadata: Metadata = { title: "Subscription" };
export const dynamic = "force-dynamic";

export default async function SubscriptionPage({ searchParams }: { searchParams: { paid?: string } }) {
  const { companyId } = await getPortalContext();
  const subscription = await getActiveSubscription(companyId);
  const justPaid = searchParams?.paid === "1";

  if (!subscription) {
    return (
      <>
        <PageHeader title="Subscription" description="You don't have an active subscription yet." />
        <ButtonLink href="/portal/subscription/checkout" className="w-fit">
          Choose a Plan
        </ButtonLink>
      </>
    );
  }

  const { plan } = subscription;

  return (
    <>
      {justPaid && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Payment confirmed — your subscription and license are now active.
        </div>
      )}
      <PageHeader
        title="Subscription"
        description="Your current plan, billing cycle and renewal details."
        actions={
          <ButtonLink href="/portal/subscription/checkout" variant="outline" size="md">
            Upgrade Plan
          </ButtonLink>
        }
      />

      <div className="rounded-xl2 border border-ink-100 bg-white p-6 shadow-card">
        <div className="flex flex-col justify-between gap-6 sm:flex-row">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-ink-500">Plan</span>
            <span className="text-xl font-bold text-ink-900">{plan.name}</span>
            <span className="text-sm text-ink-500">
              ₹{formatPlanPrice(plan.price)} / {billingFrequencyLabel(plan.billingFrequency)} · Device limit {plan.deviceLimit}
            </span>
          </div>
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <span className="text-xs font-medium uppercase tracking-wide text-ink-500">Status</span>
            <StatusChip status={subscription.status} />
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-ink-100 pt-6 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-ink-500">Start Date</dt>
            <dd className="text-sm font-medium text-ink-800">{formatDate(subscription.startDate)}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-500">Next Billing Date</dt>
            <dd className="text-sm font-medium text-ink-800">{formatDate(subscription.nextBillingDate)}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-500">Payment Gateway</dt>
            <dd className="text-sm font-medium text-ink-800">Razorpay</dd>
          </div>
        </dl>

        {subscription.cancelAtPeriodEnd && (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            This subscription will not renew after {formatDate(subscription.nextBillingDate)}.
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3 border-t border-ink-100 pt-6">
          <ButtonLink href="/portal/license" variant="outline" size="md">
            View License
          </ButtonLink>
          <ButtonLink href="/portal/billing" variant="outline" size="md">
            View Billing
          </ButtonLink>
          {!subscription.cancelAtPeriodEnd && <CancelSubscriptionButton />}
        </div>
      </div>

      <div className="rounded-xl2 border border-ink-100 bg-white p-6 shadow-card">
        <h2 className="mb-4 text-sm font-semibold text-ink-900">Plan Features</h2>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {plan.features.map((feature) => (
            <li key={feature.id} className="text-sm text-ink-600">
              • {feature.label}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
