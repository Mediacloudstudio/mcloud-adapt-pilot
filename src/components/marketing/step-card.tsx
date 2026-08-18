import type { HowItWorksStep } from "@/lib/content/marketing";

export function StepCard({ step, title, description }: HowItWorksStep) {
  return (
    <div className="relative flex flex-col gap-3 rounded-xl2 border border-ink-100 bg-white p-6 shadow-card">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
        {step}
      </span>
      <h3 className="text-base font-semibold text-ink-900">{title}</h3>
      <p className="text-sm leading-relaxed text-ink-600">{description}</p>
    </div>
  );
}
