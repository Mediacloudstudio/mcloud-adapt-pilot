import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { getAdminUsageStats } from "@/server/admin/queries";

export const metadata: Metadata = { title: "Usage" };
export const dynamic = "force-dynamic";

export default async function AdminUsagePage() {
  const stats = await getAdminUsageStats();

  return (
    <>
      <PageHeader title="Usage" description="Output volume across every customer's InDesign automation jobs." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Outputs Today" value={stats.outputsToday.toLocaleString("en-IN")} />
        <StatCard label="Outputs This Month" value={stats.outputsThisMonth.toLocaleString("en-IN")} />
        <StatCard label="Jobs Today" value={stats.jobsToday.toLocaleString("en-IN")} />
        <StatCard label="Completed / Errored" value={`${stats.doneJobs.toLocaleString("en-IN")} / ${stats.errorJobs.toLocaleString("en-IN")}`} />
      </div>

      <div className="rounded-xl2 border border-ink-100 bg-white shadow-card">
        <div className="border-b border-ink-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-ink-900">Top Customers by Output</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b border-ink-100 bg-ink-50/60 text-left text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Outputs</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {stats.topCompanies.map((row, index) => (
              <tr key={row.company?.id ?? index} className="hover:bg-ink-50/60">
                <td className="px-5 py-3">
                  {row.company ? (
                    <Link href={`/admin/customers/${row.company.id}`} className="font-medium text-brand-700 hover:underline">
                      {row.company.companyName}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-5 py-3 text-ink-600">{row.outputs.toLocaleString("en-IN")}</td>
              </tr>
            ))}
            {stats.topCompanies.length === 0 && (
              <tr>
                <td colSpan={2} className="px-5 py-6 text-center text-ink-400">
                  No usage recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
