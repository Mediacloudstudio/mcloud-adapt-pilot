// Shared "who is this and which company are they acting for" resolution
// for every customer-portal page and server action. Centralized so every
// portal page enforces the same rule: no session, no company membership,
// no data. (middleware.ts already blocks unauthenticated requests from
// reaching /portal/**; this adds the company-scoping on top.)

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getPortalContext() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.user.companyId) {
    redirect("/login");
  }

  const company = await db.company.findUnique({ where: { id: session.user.companyId } });
  if (!company) {
    redirect("/login");
  }

  return { session, company, userId: session.user.id, companyId: company.id, role: session.user.role };
}

export function requireCompanyAdmin(role: string | null) {
  if (role !== "COMPANY_ADMIN") {
    throw new Error("Only a Company Admin can perform this action.");
  }
}
