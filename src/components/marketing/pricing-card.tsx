import { Check } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export type PricingCardProps = {
  name: string;
  price: string;
  currency: string;
  deviceLimit: number;
  billingFrequencyLabel: string;
  features: string[];
  ctaLabel: string;
  href: string;
  recommended?: boolean;
};

export function PricingCard({
  name,
  price,
  currency,
  deviceLimit,
  billingFrequencyLabel,
  features,
  ctaLabel,
  href,
  recommended,
}: PricingCardProps) {
  return (
    <div
      className={`relative flex flex-col gap-6 rounded-xl2 border p-8 ${
        recommended
          ? "border-brand-600 bg-white shadow-premium ring-1 ring-brand-600"
          : "border-ink-100 bg-white shadow-card"
      }`}
    >
      {recommended && (
        <span className="absolute -top-3 left-8 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
          Recommended
        </span>
      )}

      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-ink-900">{name}</h3>
        <p className="text-sm text-ink-500">
          Maximum activated devices: <span className="font-medium text-ink-700">{deviceLimit} PC{deviceLimit > 1 ? "s" : ""}</span>
        </p>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-4xl font-bold tracking-tight text-ink-900">
          {currency} {price}
        </span>
        <span className="text-sm text-ink-500">/ {billingFrequencyLabel}</span>
      </div>

      <ButtonLink href={href} variant={recommended ? "primary" : "outline"} size="lg" className="w-full">
        {ctaLabel}
      </ButtonLink>

      <ul className="flex flex-col gap-3 border-t border-ink-100 pt-6">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm text-ink-600">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" strokeWidth={2.5} />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
