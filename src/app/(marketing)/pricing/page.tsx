import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { ButtonLink } from "@/components/ui/button";
import { PricingCard } from "@/components/marketing/pricing-card";
import { getPublicPlans, formatPlanPrice, billingFrequencyLabel, type PublicPlan } from "@/lib/plans";
import { sharedPlanFeatures } from "@/lib/content/marketing";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "MCloud Adapt Pilot pricing is based on the maximum number of computers activated at once — plans for 1, 2 or 3 PCs.",
};

// Always hit the database — pricing must never be baked into the build,
// since an admin can change it at any time (PART 45).
export const dynamic = "force-dynamic";

// Fallback shown only if the database has no plans yet (e.g. before
// `npm run db:seed` has been run) or is briefly unreachable — this keeps
// the marketing site from hard-erroring, at the cost of showing plans
// that match the seed data but aren't literally read from the DB. It is
// visually flagged so nobody mistakes it for a live, editable price.
const fallbackNotice =
  "Live pricing is loaded from the database and can be changed by an admin at any time.";

export default async function PricingPage() {
  let plans: PublicPlan[] = [];
  let loadError = false;

  try {
    plans = await getPublicPlans();
  } catch {
    loadError = true;
  }

  return (
    <>
      <section className="bg-gradient-to-b from-brand-50/70 to-white py-20 sm:py-28">
        <Container className="flex flex-col items-center gap-6 text-center">
          <SectionHeading
            eyebrow="Pricing"
            title="Simple pricing, based on how many computers you activate"
            description="Every plan includes the full MCloud Adapt Pilot desktop application. The only difference is how many computers can be activated at the same time."
          />
        </Container>
      </section>

      <section className="pb-24">
        <Container>
          {loadError || plans.length === 0 ? (
            <div className="mx-auto max-w-lg rounded-xl2 border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-800">
              {loadError
                ? "Pricing couldn't be loaded from the database right now. Run through the README setup steps (DATABASE_URL + npm run db:seed) and reload this page."
                : "No plans found yet — run `npm run db:seed` to load the 1/2/3 PC plans, then reload this page."}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {plans.map((plan) => (
                  <PricingCard
                    key={plan.id}
                    name={plan.name}
                    price={formatPlanPrice(plan.price)}
                    currency={plan.currency === "INR" ? "₹" : plan.currency}
                    deviceLimit={plan.deviceLimit}
                    billingFrequencyLabel={billingFrequencyLabel(plan.billingFrequency)}
                    features={
                      plan.features.length > 0
                        ? plan.features.map((feature) => feature.label)
                        : sharedPlanFeatures
                    }
                    ctaLabel={`Choose ${plan.deviceLimit} PC${plan.deviceLimit > 1 ? "s" : ""}`}
                    href={`/register?plan=${plan.code}`}
                    recommended={plan.isRecommended}
                  />
                ))}
              </div>
              <p className="mt-8 text-center text-xs text-ink-400">{fallbackNotice}</p>
            </>
          )}
        </Container>
      </section>

      <section className="pb-24">
        <Container>
          <div className="mx-auto flex max-w-3xl flex-col gap-6 rounded-2xl border border-ink-100 bg-ink-50/60 p-8">
            <h2 className="text-lg font-semibold text-ink-900">Need more than 3 PCs, or a custom contract?</h2>
            <p className="text-sm text-ink-600">
              Enterprise and multi-location accounts can get custom pricing, custom device
              limits, or an extended trial — this is configured per company from the admin
              portal and fully audited (no separate sales tooling required).
            </p>
            <div>
              <ButtonLink href="/support" variant="outline">
                Contact Us About Enterprise Pricing
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
