import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { solutionSegments } from "@/lib/content/marketing";

export const metadata: Metadata = {
  title: "Solutions",
  description:
    "How creative agencies, brand teams, retail marketing, trade marketing, and multi-location businesses use MCloud Adapt Pilot to automate creative production.",
};

export default function SolutionsPage() {
  return (
    <>
      <section className="bg-gradient-to-b from-brand-50/70 to-white py-20 sm:py-28">
        <Container className="flex flex-col items-center gap-6 text-center">
          <SectionHeading
            eyebrow="Solutions"
            title="Built for every team that produces creative at scale"
            description="Whatever role dimensions, languages and personalization play in your production process, MCloud Adapt Pilot fits the same underlying workflow."
          />
        </Container>
      </section>

      <section className="pb-24">
        <Container>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {solutionSegments.map((segment) => (
              <div
                key={segment.id}
                id={segment.id}
                className="scroll-mt-24 flex flex-col gap-3 rounded-xl2 border border-ink-100 bg-white p-7 shadow-card"
              >
                <h3 className="text-lg font-semibold text-ink-900">{segment.title}</h3>
                <p className="text-sm leading-relaxed text-ink-600">{segment.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="pb-24">
        <Container>
          <div className="flex flex-col items-center gap-6 rounded-2xl border border-ink-100 bg-ink-50/60 px-8 py-14 text-center">
            <h2 className="text-2xl font-bold text-ink-900">Don&apos;t see your exact use case?</h2>
            <p className="max-w-lg text-ink-600">
              MCloud Adapt Pilot&apos;s automation model adapts to most InDesign-based production
              workflows — talk to us about yours.
            </p>
            <ButtonLink href="/support" variant="outline" size="lg">
              Talk to Us
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}
