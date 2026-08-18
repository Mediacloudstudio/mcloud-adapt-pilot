import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { ProfileForm, BillingProfileForm, ChangePasswordForm } from "@/components/portal/settings-forms";
import { getPortalContext } from "@/server/portal/context";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Account Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { session, company, userId, role } = await getPortalContext();
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });

  return (
    <>
      <PageHeader title="Account Settings" description="Manage your profile, billing details and password." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ProfileForm firstName={user.firstName} lastName={user.lastName} phone={user.phone ?? ""} />
        <ChangePasswordForm />
      </div>

      {role === "COMPANY_ADMIN" && (
        <BillingProfileForm
          legalName={company.legalName ?? ""}
          gstin={company.gstin ?? ""}
          billingAddress={company.billingAddress ?? ""}
          state={company.state ?? ""}
          pinCode={company.pinCode ?? ""}
          country={company.country}
        />
      )}

      <p className="text-xs text-ink-400">
        Signed in as {session.user.email}. Notification preferences arrive alongside the notification system
        (PART 58).
      </p>
    </>
  );
}
