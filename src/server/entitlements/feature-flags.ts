// Resolves which feature flags are actually ON for a given company/plan.
// Precedence, most specific wins: a COMPANY-scoped row for this exact
// company beats a PLAN-scoped row for their plan, which beats a GLOBAL
// row — the same "most specific override wins" pattern used for device
// limits (src/server/licensing/device-limit.ts) and pricing
// (CompanyPlanOverride). The desktop app only ever sees the resolved
// boolean per code, never the underlying scope rows.

import { db } from "@/lib/db";

const SCOPE_RANK: Record<string, number> = { GLOBAL: 0, PLAN: 1, COMPANY: 2 };

export async function resolveFeatureFlags(companyId: string, planId: string | null): Promise<Record<string, boolean>> {
  const flags = await db.featureFlag.findMany({
    where: {
      OR: [{ scope: "GLOBAL" }, ...(planId ? [{ scope: "PLAN" as const, planId }] : []), { scope: "COMPANY", companyId }],
    },
  });

  const resolved = new Map<string, { enabled: boolean; rank: number }>();
  for (const flag of flags) {
    const rank = SCOPE_RANK[flag.scope] ?? 0;
    const current = resolved.get(flag.code);
    if (!current || rank >= current.rank) {
      resolved.set(flag.code, { enabled: flag.enabled, rank });
    }
  }

  return Object.fromEntries(Array.from(resolved.entries()).map(([code, v]) => [code, v.enabled]));
}
