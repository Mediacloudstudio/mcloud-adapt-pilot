import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { getPortalContext } from "@/server/portal/context";
import { getUsageStats } from "@/server/portal/queries";

export const metadata: Metadata = { title: "Usage" };
export const dynamic = "force-dynamic";

export default async function UsagePage() {
  const { companyId } = await getPortalContext();
  const stats = await getUsageStats(companyId);

  const maxDailyOutput = Math.max(1, ...stats.dailyOutputs.map((d) => d.total));

  return (
    <>
      <PageHeader title="Usage" description="Production activity across your account." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Outputs Today" value={stats.outputsToday.toLocaleString("en-IN")} />
        <StatCard label="Outputs This Month" value={stats.outputsThisMonth.toLocaleString("en-IN")} />
        <StatCard label="Jobs Today" value={stats.jobsToday} />
        <StatCard label="Devices Active" value={stats.activeDevices} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Successful Jobs" value={stats.doneJobs} />
        <StatCard label="Failed Jobs" value={stats.errorJobs} />
        <StatCard label="Most Used Template" value={stats.mostUsedTemplateName ?? "—"} />
      </div>

      <div className="rounded-xl2 border border-ink-100 bg-white p-6 shadow-card">
        <h2 className="mb-6 text-sm font-semibold text-ink-900">Output Trend — Last 14 Days</h2>
        {/* Fixed-height bar row, separate from the label row below it — a
            percentage `height` only resolves against a parent with a
            definite (non-auto) height, so the bars need their own h-32
            container rather than living inside a content-sized column. */}
        <div className="flex h-32 items-end gap-2">
          {stats.dailyOutputs.map((day) => (
            <div
              key={day.date}
              className="flex-1 rounded-t bg-brand-500/80"
              style={{ height: `${Math.max(4, (day.total / maxDailyOutput) * 100)}%` }}
              title={`${day.total} outputs`}
            />
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          {stats.dailyOutputs.map((day) => (
            <span key={day.date} className="flex-1 text-center text-[10px] text-ink-400">
              {day.date.slice(5)}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
