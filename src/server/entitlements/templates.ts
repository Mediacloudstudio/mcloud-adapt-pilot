// Which InDesign templates a company is actually entitled to generate
// from — driven entirely by the CustomerTemplate grants an admin makes
// in Admin → Templates (Phase 5). A template only shows up here if (a)
// it's been explicitly assigned to this company AND (b) it's currently
// ACTIVE — an admin archiving a template immediately hides it from
// every desktop client without touching any grant rows.

import { db } from "@/lib/db";

export async function resolveCustomerTemplates(companyId: string) {
  const grants = await db.customerTemplate.findMany({
    where: { companyId, template: { status: "ACTIVE" } },
    include: { template: { include: { category: true } } },
    orderBy: { grantedAt: "desc" },
  });

  return grants.map((grant) => ({
    id: grant.template.id,
    name: grant.template.name,
    category: grant.template.category.label,
    categoryCode: grant.template.category.code,
    version: grant.template.version,
    thumbnailUrl: grant.template.thumbnailUrl,
    description: grant.template.description,
    grantedAt: grant.grantedAt,
  }));
}
