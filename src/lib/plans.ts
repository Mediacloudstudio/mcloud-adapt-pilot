// Reads pricing plans from the database (PART 11/45 — admin can change
// price, device limit, or billing frequency from the admin backend with
// zero frontend code changes, because the pricing page never hardcodes a
// price; it always reads through this function).

import { db } from "@/lib/db";
import type { Plan, PlanFeature } from "@prisma/client";

export type PublicPlan = Plan & { features: PlanFeature[] };

const billingFrequencyLabels: Record<string, string> = {
  MONTHLY: "month",
  ANNUAL: "year",
  ONE_TIME: "one-time",
  CUSTOM: "term",
};

export function billingFrequencyLabel(frequency: string): string {
  return billingFrequencyLabels[frequency] ?? frequency.toLowerCase();
}

export function formatPlanPrice(price: Plan["price"]): string {
  // Prisma's Decimal serializes to a string; format with Indian digit
  // grouping (₹15,000 rather than ₹15000) without pulling in a currency
  // library for one call site.
  const numeric = Number(price);
  return numeric.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export async function getPublicPlans(): Promise<PublicPlan[]> {
  return db.plan.findMany({
    where: { status: "ACTIVE" },
    orderBy: { sortOrder: "asc" },
    include: { features: true },
  });
}
