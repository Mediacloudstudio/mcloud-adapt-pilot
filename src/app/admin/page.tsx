import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusChip } from "@/components/ui/status-chip";
import { formatPlanPrice } from "@/lib/plans";
import { getAdminDashboardStats } from "@/server/admin/queries";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();

  return (
    <>
      <PageHeader title="Admin Dashboard" description="Cross-account overview of MCloud Adapt Pilot." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Customers" value={stats.totalCustomers} />
        <StatCard label="Active Subscriptions" value={stats.activeSubscriptions} />
        <StatCard label="Suspended Subscriptions" value={stats.suspendedSubscriptions} />
        <StatCard label="Trial Customers" value={stats.trialSubscriptions} />
        <StatCard label="Active Licenses" value={stats.activeLicenses} />
        <StatCard label="Active Devices" value={stats.activeDevices} />
        <StatCard label="Monthly Revenue" value={`₹${formatPlanPrice(stats.monthlyRevenue)}`} />
        <StatCard label="Failed Payments" value={stats.failedPayments} />
        <StatCard label="Outputs Today" value={stats.outputsToday.toLocaleString("en-IN")} />
        <StatCard label="Outputs This Month" value={stats.outputsThisMonth.toLocaleString("en-IN")} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-3 rounded-xl2 border border-ink-100 bg-white p-6 shadow-card">
          <h2 className="text-sm font-semibold text-ink-900">Recent Payments</h2>
          {stats.recentPayments.length === 0 ? (
            <p className="text-sm text-ink-500">None yet.</p>
          ) : (
            stats.recentPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-ink-700">{p.company.companyName}</span>
                <StatusChip status={p.status} />
              </div>
            ))
          )}
        </div>
        <div className="flex flex-col gap-3 rounded-xl2 border border-ink-100 bg-white p-6 shadow-card">
          <h2 className="text-sm font-semibold text-ink-900">Recent Activations</h2>
          {stats.recentDevices.length === 0 ? (
            <p className="text-sm text-ink-500">None yet.</p>
          ) : (
            stats.recentDevices.map((d) => (
              <div key={d.id} className="flex items-center justify-between text-sm">
                <span className="text-ink-700">{d.company.companyName}</span>
                <StatusChip status={d.status} />
              </div>
            ))
          )}
        </div>
        <div className="flex flex-col gap-3 rounded-xl2 border border-ink-100 bg-white p-6 shadow-card">
          <h2 className="text-sm font-semibold text-ink-900">Recent Errors</h2>
          {stats.recentErrorJobs.length === 0 ? (
            <p className="text-sm text-ink-500">None yet.</p>
          ) : (
            stats.recentErrorJobs.map((j) => (
              <div key={j.id} className="flex items-center justify-between text-sm">
                <span className="text-ink-700">{j.company.companyName}</span>
                <span className="text-xs text-red-600">{j.errorMessage ?? "Error"}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
