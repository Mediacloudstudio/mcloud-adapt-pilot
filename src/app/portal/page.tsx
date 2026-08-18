import type { Metadata } from "next";
import Link from "next/link";
import { Cpu, Package, ShieldCheck, Monitor, Receipt, CalendarClock, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusChip } from "@/components/ui/status-chip";
import { ButtonLink } from "@/components/ui/button";
import { formatPlanPrice } from "@/lib/plans";
import { getPortalContext } from "@/server/portal/context";
import { getDashboardData } from "@/server/portal/queries";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function PortalDashboardPage() {
  const { companyId } = await getPortalContext();
  const data = await getDashboardData(companyId);

  const plan = data.subscription?.plan;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="An overview of your subscription, license and recent activity."
        actions={
          <ButtonLink href="/portal/support" variant="outline" size="md">
            Get Support
          </ButtonLink>
        }
      />

      {data.appVersion && (
        <div className="flex items-center justify-between rounded-xl2 border border-brand-200 bg-brand-50 px-5 py-3 text-sm text-brand-800">
          <span>
            MCloud Adapt Pilot {data.appVersion.version} is available.
          </span>
          <Link href="/portal/downloads" className="flex items-center gap-1 font-semibold hover:underline">
            Download <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Current Plan"
          value={plan?.name ?? "No Plan"}
          sublabel={plan ? `₹${formatPlanPrice(plan.price)}` : undefined}
          icon={<Package className="h-4 w-4" />}
        />
        <StatCard
          label="License Status"
          value={<StatusChip status={data.license?.status ?? "—"} />}
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <StatCard
          label="Activated Devices"
          value={`${data.activeDeviceCount} / ${data.deviceLimit}`}
          icon={<Monitor className="h-4 w-4" />}
        />
        <StatCard
          label="Outputs This Month"
          value={data.outputsThisMonth.toLocaleString("en-IN")}
          icon={<Cpu className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Billing Status"
          value={<StatusChip status={data.subscription?.status ?? "—"} />}
          icon={<Receipt className="h-4 w-4" />}
        />
        <StatCard
          label="Next Renewal"
          value={data.subscription?.nextBillingDate ? formatDate(data.subscription.nextBillingDate) : "—"}
          icon={<CalendarClock className="h-4 w-4" />}
        />
        <StatCard label="Application Version" value={data.appVersion?.version ?? "—"} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-xl2 border border-ink-100 bg-white p-6 shadow-card">
          <h2 className="text-sm font-semibold text-ink-900">Recent Jobs</h2>
          {data.recentJobs.length === 0 ? (
            <p className="text-sm text-ink-500">No production jobs yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-ink-100">
              {data.recentJobs.map((job) => (
                <li key={job.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div className="flex flex-col">
                    <span className="font-medium text-ink-800">{job.template?.name ?? "Unknown template"}</span>
                    <span className="text-xs text-ink-500">
                      {job.device?.deviceName ?? "Unknown device"} · {job.outputCount} outputs
                    </span>
                  </div>
                  <StatusChip status={job.status} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-4 rounded-xl2 border border-ink-100 bg-white p-6 shadow-card">
          <h2 className="text-sm font-semibold text-ink-900">Recent Payments</h2>
          {data.recentPayments.length === 0 ? (
            <p className="text-sm text-ink-500">No payments yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-ink-100">
              {data.recentPayments.map((payment) => (
                <li key={payment.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div className="flex flex-col">
                    <span className="font-medium text-ink-800">₹{formatPlanPrice(payment.amount)}</span>
                    <span className="text-xs text-ink-500">{formatDate(payment.createdAt)}</span>
                  </div>
                  <StatusChip status={payment.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
