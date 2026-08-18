import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { FeatureCard } from "@/components/marketing/feature-card";
import { features } from "@/lib/content/marketing";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Automated InDesign production, multi-size adaptation, localization, batch processing, PDF export and centralized licensing — all the capabilities behind MCloud Adapt Pilot.",
};

export default function FeaturesPage() {
  return (
    <>
      <section className="bg-gradient-to-b from-brand-50/70 to-white py-20 sm:py-28">
        <Container className="flex flex-col items-center gap-6 text-center">
          <SectionHeading
            eyebrow="Features"
            title="Built for automated, brand-consistent creative production"
            description="Every capability MCloud Adapt Pilot needs to turn one InDesign template into a full production pipeline."
          />
        </Container>
      </section>

      <section className="pb-24">
        <Container>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </Container>
      </section>

      <section className="pb-24">
        <Container>
          <div className="flex flex-col items-center gap-6 rounded-2xl border border-ink-100 bg-ink-50/60 px-8 py-14 text-center">
            <h2 className="text-2xl font-bold text-ink-900">See these features in your own workflow</h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/how-it-works" size="lg">
                See How It Works
              </ButtonLink>
              <ButtonLink href="/pricing" variant="outline" size="lg">
                View Pricing
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
