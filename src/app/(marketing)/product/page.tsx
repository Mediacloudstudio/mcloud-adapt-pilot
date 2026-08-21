import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { WorkflowDiagram } from "@/components/marketing/workflow-diagram";
import { FeatureCard } from "@/components/marketing/feature-card";
import { features } from "@/lib/content/marketing";

export const metadata: Metadata = {
  title: "Product",
  description:
    "MCloud Adapt Pilot is a desktop application that works with Adobe InDesign to automate creative production — multi-size, multi-language, data-driven output at scale.",
};

const controlModel = [
  { label: "Razorpay", detail: "Payment transaction" },
  { label: "MediaCloud Backend", detail: "Subscription status" },
  { label: "Plan", detail: "Device entitlement and features" },
  { label: "License Server", detail: "Application authorization" },
  { label: "MCloud Adapt Pilot", detail: "Local automation" },
  { label: "Adobe InDesign", detail: "Creative production" },
];

export default function ProductPage() {
  return (
    <>
      <section className="bg-gradient-to-b from-brand-50/70 to-white py-20 sm:py-28">
        <Container className="flex flex-col items-center gap-6 text-center">
          <SectionHeading
            eyebrow="Product"
            title="A desktop application that works with Adobe InDesign to automate creative production"
            description="MCloud Adapt Pilot uses your predefined InDesign templates to generate multiple creative outputs — across dimensions, aspect ratios, locations, languages, text, images and customer data — with automated PDF output at the end of the line."
            maxWidth="max-w-3xl"
            titleClassName="text-3xl sm:text-3xl"
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/register" size="lg">
              Get Started
            </ButtonLink>
            <ButtonLink href="/how-it-works" variant="outline" size="lg">
              See How It Works
            </ButtonLink>
          </div>
        </Container>
        <Container className="mt-16">
          <WorkflowDiagram />
        </Container>
      </section>

      <section className="py-20 sm:py-28">
        <Container className="flex flex-col items-center gap-14">
          <SectionHeading
            eyebrow="What It Automates"
            title="Everything that used to be a manual production step"
          />
          <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-ink-950 py-20 text-white sm:py-28">
        <Container className="flex flex-col items-center gap-14">
          <div className="flex max-w-2xl flex-col items-center gap-4 text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-brand-400">
              How Control Is Divided
            </span>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              The website never operates Adobe InDesign directly
            </h2>
            <p className="text-ink-300">
              The website controls whether you&apos;re authorized to use MCloud Adapt Pilot. The
              actual InDesign automation always happens locally, on your machine, through the
              desktop application.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3">
            {controlModel.map((item, index) => (
              <div key={item.label} className="flex items-center gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">
                  {index + 1}
                </span>
                <div className="flex flex-1 items-center justify-between rounded-lg border border-white/10 bg-white/5 px-5 py-3">
                  <span className="font-semibold">{item.label}</span>
                  <span className="text-sm text-ink-300">controls {item.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
