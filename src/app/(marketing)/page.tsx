import { CheckCircle2 } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { WorkflowDiagram } from "@/components/marketing/workflow-diagram";
import { FeatureCard } from "@/components/marketing/feature-card";
import { StepCard } from "@/components/marketing/step-card";
import {
  heroContent,
  problems,
  solutionSteps,
  features,
  howItWorksSteps,
} from "@/lib/content/marketing";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="overflow-hidden bg-gradient-to-b from-brand-50/70 via-white to-white pb-20 pt-16 sm:pt-24">
        <Container className="flex flex-col items-center gap-6 text-center">
          <span className="rounded-full border border-brand-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand-700">
            {heroContent.eyebrow}
          </span>
          <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-ink-900 sm:text-6xl">
            {heroContent.headline}
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-ink-600 sm:text-xl">
            {heroContent.subhead}
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={heroContent.primaryCta.href} size="lg">
              {heroContent.primaryCta.label}
            </ButtonLink>
            <ButtonLink href={heroContent.secondaryCta.href} variant="outline" size="lg">
              {heroContent.secondaryCta.label}
            </ButtonLink>
          </div>
        </Container>

        <Container className="mt-16">
          <WorkflowDiagram />
        </Container>
      </section>

      {/* Problem */}
      <section className="py-20 sm:py-28">
        <Container className="flex flex-col items-center gap-14">
          <SectionHeading
            eyebrow="The Problem"
            title="Creative production doesn't scale the way campaigns need it to"
            description="The same underlying work happens over and over — for every size, every market, every language."
          />
          <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {problems.map((problem) => (
              <div
                key={problem.title}
                className="flex flex-col gap-2 rounded-xl2 border border-ink-100 bg-ink-50/60 p-6"
              >
                <h3 className="text-sm font-semibold text-ink-900">{problem.title}</h3>
                <p className="text-sm leading-relaxed text-ink-600">{problem.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Solution */}
      <section className="bg-ink-950 py-20 text-white sm:py-28">
        <Container className="flex flex-col items-center gap-14">
          <div className="flex max-w-2xl flex-col items-center gap-4 text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-brand-400">
              The Solution
            </span>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Create the master design once. Automate the rest.
            </h2>
          </div>
          <ol className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {solutionSteps.map((step, index) => (
              <li
                key={step}
                className="flex items-start gap-3 rounded-xl2 border border-white/10 bg-white/5 p-5"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-bold">
                  {index + 1}
                </span>
                <span className="pt-0.5 text-sm text-ink-200">{step}</span>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* Features preview */}
      <section className="py-20 sm:py-28">
        <Container className="flex flex-col items-center gap-14">
          <SectionHeading
            eyebrow="Key Features"
            title="Everything a creative production team needs to automate output"
          />
          <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.slice(0, 6).map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
          <ButtonLink href="/features" variant="outline" size="lg">
            View All Features
          </ButtonLink>
        </Container>
      </section>

      {/* How it works preview */}
      <section className="bg-ink-50/60 py-20 sm:py-28">
        <Container className="flex flex-col items-center gap-14">
          <SectionHeading eyebrow="How It Works" title="From master template to finished files" />
          <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {howItWorksSteps.map((step) => (
              <StepCard key={step.step} {...step} />
            ))}
          </div>
          <ButtonLink href="/how-it-works" variant="outline" size="lg">
            See the Full Workflow
          </ButtonLink>
        </Container>
      </section>

      {/* CTA band */}
      <section className="py-20 sm:py-28">
        <Container>
          <div className="flex flex-col items-center gap-6 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-900 px-8 py-16 text-center text-white sm:px-16">
            <CheckCircle2 className="h-10 w-10 text-brand-200" strokeWidth={1.5} />
            <h2 className="max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
              Start Your Automation Journey
            </h2>
            <p className="max-w-lg text-brand-100">
              Choose a plan, connect your InDesign templates, and start generating finished
              creative at production scale.
            </p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/register" variant="secondary" size="lg" className="bg-white !text-brand-800 hover:bg-brand-50">
                Get Started
              </ButtonLink>
              <ButtonLink href="/pricing" variant="outline" size="lg" className="border-white/40 !text-white hover:bg-white/10">
                View Pricing
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
