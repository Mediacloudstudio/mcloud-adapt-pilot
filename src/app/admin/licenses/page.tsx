import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import { ActionButton } from "@/components/admin/action-button";
import { getLicenses } from "@/server/admin/queries";
import { setLicenseStatus, setLicenseDeviceLimitOverride } from "@/server/admin/actions";

export const metadata: Metadata = { title: "Licenses" };
export const dynamic = "force-dynamic";

export default async function AdminLicensesPage() {
  const licenses = await getLicenses();

  return (
    <>
      <PageHeader title="Licenses" description={`${licenses.length} licenses issued.`} />

      <div className="flex flex-col gap-4">
        {licenses.map((license) => {
          const activeDevices = license.devices.filter((d) => d.status === "ACTIVE").length;
          return (
            <div key={license.id} className="flex flex-col gap-4 rounded-xl2 border border-ink-100 bg-white p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <Link href={`/admin/customers/${license.companyId}`} className="font-medium text-brand-700 hover:underline">
                  {license.company.companyName}
                </Link>
                <span className="font-mono text-xs text-ink-500">{license.displayKey}</span>
                <span className="text-xs text-ink-500">
                  {activeDevices} / {license.deviceLimitOverride ?? license.subscription?.plan.deviceLimit ?? "—"} devices active
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <StatusChip status={license.status} />
                <form action={async (formData: FormData) => { "use server"; await setLicenseDeviceLimitOverride(license.id, formData); }} className="flex items-center gap-1">
                  <input
                    type="number"
                    name="deviceLimitOverride"
                    placeholder="Override"
                    defaultValue={license.deviceLimitOverride ?? ""}
                    className="w-24 rounded-lg border border-ink-200 px-2 py-1.5 text-xs outline-none focus:border-brand-500"
                  />
                  <button type="submit" className="rounded-lg border border-ink-200 px-2.5 py-1.5 text-xs font-semibold text-ink-700 hover:border-brand-400">
                    Set
                  </button>
                </form>
                {license.status !== "ACTIVE" && (
                  <ActionButton action={setLicenseStatus.bind(null, license.id, "ACTIVE")} label="Reactivate" variant="primary" />
                )}
                {license.status !== "SUSPENDED" && (
                  <ActionButton action={setLicenseStatus.bind(null, license.id, "SUSPENDED")} label="Suspend" variant="outline" />
                )}
                {license.status !== "REVOKED" && (
                  <ActionButton
                    action={setLicenseStatus.bind(null, license.id, "REVOKED")}
                    label="Revoke"
                    variant="ghost"
                    confirmMessage="Revoke this license permanently?"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
