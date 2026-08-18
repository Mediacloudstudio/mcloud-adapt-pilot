import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button";
import { getPortalContext } from "@/server/portal/context";
import { getActiveSubscription, getLatestAppVersion } from "@/server/portal/queries";

export const metadata: Metadata = { title: "Downloads" };
export const dynamic = "force-dynamic";

const ENTITLED_STATUSES = new Set(["ACTIVE", "GRACE_PERIOD", "TRIAL"]);

export default async function DownloadsPage() {
  const { companyId } = await getPortalContext();
  const [subscription, appVersion] = await Promise.all([
    getActiveSubscription(companyId),
    getLatestAppVersion(),
  ]);

  const entitled = subscription ? ENTITLED_STATUSES.has(subscription.status) : false;

  return (
    <>
      <PageHeader title="Downloads" description="Download the MCloud Adapt Pilot desktop application." />

      {!entitled ? (
        <div className="rounded-xl2 border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          Your subscription isn&apos;t currently active, so the installer isn&apos;t available. Visit{" "}
          <a href="/portal/billing" className="font-semibold underline">
            Billing
          </a>{" "}
          to resolve this.
        </div>
      ) : !appVersion ? (
        <div className="rounded-xl2 border border-ink-100 bg-white p-6 text-sm text-ink-500 shadow-card">
          No release has been published yet.
        </div>
      ) : (
        <div className="rounded-xl2 border border-ink-100 bg-white p-6 shadow-card">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div className="flex flex-col gap-1">
              <span className="text-lg font-semibold text-ink-900">MCloud Adapt Pilot {appVersion.version}</span>
              <span className="text-sm text-ink-500">
                Platform: {appVersion.platform === "WINDOWS" ? "Windows 10 / Windows 11" : "macOS"}
              </span>
              <span className="text-sm text-ink-500">
                Released {new Date(appVersion.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href={appVersion.installerUrl} size="md" target="_blank">
                Download
              </ButtonLink>
              <ButtonLink href="/docs" variant="outline" size="md">
                Installation Guide
              </ButtonLink>
            </div>
          </div>
          {appVersion.releaseNotes && (
            <p className="mt-6 border-t border-ink-100 pt-6 text-sm text-ink-600">{appVersion.releaseNotes}</p>
          )}
          <p className="mt-4 text-xs text-ink-400">
            This link is served directly today. Phase 8 replaces it with a signed, expiring URL and records each
            download (PART 59), without changing this page.
          </p>
        </div>
      )}
    </>
  );
}
