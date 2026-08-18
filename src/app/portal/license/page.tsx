import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import { ButtonLink } from "@/components/ui/button";
import { CopyLicenseKeyButton } from "@/components/portal/copy-license-key-button";
import { getPortalContext } from "@/server/portal/context";
import { getLicense } from "@/server/portal/queries";

export const metadata: Metadata = { title: "License" };
export const dynamic = "force-dynamic";

export default async function LicensePage() {
  const { companyId, company } = await getPortalContext();
  const license = await getLicense(companyId);

  if (!license) {
    return <PageHeader title="License" description="No license has been issued for your account yet." />;
  }

  const activeDeviceCount = license.devices.filter((d) => d.status === "ACTIVE").length;
  const deviceLimit = license.deviceLimitOverride ?? license.subscription?.plan.deviceLimit ?? 0;

  return (
    <>
      <PageHeader title="License" description="MCloud Adapt Pilot software license details." />

      <div className="rounded-xl2 border border-ink-100 bg-white p-6 shadow-card">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
          <div className="flex flex-col gap-3">
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-ink-500">Product</span>
              <p className="text-sm font-semibold text-ink-900">MCloud Adapt Pilot</p>
            </div>
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-ink-500">License</span>
              <p className="font-mono text-lg font-semibold text-ink-900">{license.displayKey}</p>
            </div>
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-ink-500">Licensed To</span>
              <p className="text-sm font-medium text-ink-800">{company.companyName}</p>
            </div>
          </div>
          <StatusChip status={license.status} />
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-ink-100 pt-6 sm:grid-cols-4">
          <div>
            <dt className="text-xs text-ink-500">Plan</dt>
            <dd className="text-sm font-medium text-ink-800">{license.subscription?.plan.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-500">Device Limit</dt>
            <dd className="text-sm font-medium text-ink-800">{deviceLimit}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-500">Activated</dt>
            <dd className="text-sm font-medium text-ink-800">{activeDeviceCount}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-500">Valid Until</dt>
            <dd className="text-sm font-medium text-ink-800">
              {license.validUntil
                ? new Date(license.validUntil).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                : "—"}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap gap-3 border-t border-ink-100 pt-6">
          <CopyLicenseKeyButton displayKey={license.displayKey} />
          <ButtonLink href="/portal/devices" variant="outline" size="md">
            Manage Devices
          </ButtonLink>
          <ButtonLink href="/portal/subscription" variant="outline" size="md">
            View Subscription
          </ButtonLink>
        </div>
      </div>
    </>
  );
}
