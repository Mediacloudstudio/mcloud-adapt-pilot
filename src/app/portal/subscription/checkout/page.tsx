import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { CheckoutButton } from "@/components/billing/checkout-button";
import { getPortalContext } from "@/server/portal/context";
import { getActiveSubscription } from "@/server/portal/queries";
import { getPublicPlans, formatPlanPrice, billingFrequencyLabel } from "@/lib/plans";

export const metadata: Metadata = { title: "Choose a Plan" };
export const dynamic = "force-dynamic";

export default async function SubscriptionCheckoutPage() {
  const { companyId, session } = await getPortalContext();
  const [plans, currentSubscription] = await Promise.all([getPublicPlans(), getActiveSubscription(companyId)]);

  return (
    <>
      <PageHeader
        title="Choose a Plan"
        description="Pricing shown here is fetched live and always matches what MediaCloud has configured — you'll never be charged more than what's shown before you pay."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrentPlan = currentSubscription?.planId === plan.id && currentSubscription.status === "ACTIVE";
          return (
            <div key={plan.id} className="flex flex-col gap-4 rounded-xl2 border border-ink-100 bg-white p-6 shadow-card">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-ink-900">{plan.name}</h2>
                <p className="text-sm text-ink-500">Up to {plan.deviceLimit} device(s)</p>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold text-ink-900">₹{formatPlanPrice(plan.price)}</span>
                <span className="text-sm text-ink-500">/ {billingFrequencyLabel(plan.billingFrequency)} + GST</span>
              </div>
              <ul className="flex flex-col gap-2 border-t border-ink-100 pt-4">
                {plan.features.map((feature) => (
                  <li key={feature.id} className="text-sm text-ink-600">
                    • {feature.label}
                  </li>
                ))}
              </ul>
              {isCurrentPlan ? (
                <span className="mt-2 inline-flex w-fit items-center rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                  Your current plan
                </span>
              ) : (
                <CheckoutButton
                  planId={plan.id}
                  planName={plan.name}
                  customerEmail={session.user.email}
                  customerName={`${session.user.firstName} ${session.user.lastName}`}
                  label={currentSubscription ? "Switch & Pay" : "Pay & Activate"}
                />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
