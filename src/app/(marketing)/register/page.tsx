import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Get Started",
  robots: { index: false },
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: { plan?: string };
}) {
  let preselectedPlanName: string | undefined;

  if (searchParams.plan) {
    try {
      const plan = await db.plan.findUnique({ where: { code: searchParams.plan } });
      preselectedPlanName = plan?.name;
    } catch {
      // Database unreachable — registration form still renders fine
      // without the "signing up for X" subtitle.
    }
  }

  return <RegisterForm preselectedPlanName={preselectedPlanName} />;
}
