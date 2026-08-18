import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { howItWorksSteps } from "@/lib/content/marketing";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "From building a master InDesign template to generating localized, resized creative files automatically — the full MCloud Adapt Pilot workflow.",
};

export default function HowItWorksPage() {
  return (
    <>
      <section className="bg-gradient-to-b from-brand-50/70 to-white py-20 sm:py-28">
        <Container className="flex flex-col items-center gap-6 text-center">
          <SectionHeading
            eyebrow="How It Works"
            title="Five steps from master template to finished production files"
            description="MCloud Adapt Pilot sits between your InDesign template and your production data — the software controls whether you're authorized to run it, the desktop app does the automation locally."
          />
        </Container>
      </section>

      <section className="pb-24">
        <Container>
          <div className="mx-auto flex max-w-3xl flex-col">
            {howItWorksSteps.map((step, index) => (
              <div key={step.step} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white">
                    {step.step}
                  </span>
                  {index < howItWorksSteps.length - 1 && (
                    <span className="my-2 w-px flex-1 bg-ink-200" aria-hidden="true" />
                  )}
                </div>
                <div className="flex flex-col gap-1.5 pb-12">
                  <h3 className="text-xl font-semibold text-ink-900">{step.title}</h3>
                  <p className="text-ink-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="pb-24">
        <Container>
          <div className="flex flex-col items-center gap-6 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-900 px-8 py-14 text-center text-white">
            <h2 className="text-2xl font-bold">Ready to automate your first template?</h2>
            <ButtonLink
              href="/register"
              variant="secondary"
              size="lg"
              className="bg-white !text-brand-800 hover:bg-brand-50"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}
