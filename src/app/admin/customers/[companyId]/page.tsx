import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import { ActionButton } from "@/components/admin/action-button";
import { formatPlanPrice } from "@/lib/plans";
import { getCustomerDetail, getPlans } from "@/server/admin/queries";
import { suspendCustomer, reactivateCustomer, extendSubscriptionAccess, changeCustomerPlan } from "@/server/admin/actions";

export const metadata: Metadata = { title: "Customer" };
export const dynamic = "force-dynamic";

const inputClass = "rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500";

export default async function AdminCustomerDetailPage({ params }: { params: { companyId: string } }) {
  const [company, plans] = await Promise.all([getCustomerDetail(params.companyId), getPlans()]);
  if (!company) notFound();

  const subscription = company.subscriptions[0];
  const license = company.licenses[0];

  return (
    <>
      <PageHeader
        title={company.companyName}
        description={company.users[0]?.user.email}
        actions={
          <>
            <StatusChip status={company.status} />
            {company.status === "SUSPENDED" ? (
              <ActionButton action={reactivateCustomer.bind(null, company.id)} label="Reactivate Customer" variant="primary" />
            ) : (
              <ActionButton
                action={suspendCustomer.bind(null, company.id)}
                label="Suspend Customer"
                variant="secondary"
                confirmMessage="Suspend this customer? All their devices and sessions will be blocked immediately."
              />
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-xl2 border border-ink-100 bg-white p-6 shadow-card">
          <h2 className="text-sm font-semibold text-ink-900">Subscription</h2>
          {subscription ? (
            <>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-xs text-ink-500">Plan</dt><dd className="font-medium text-ink-800">{subscription.plan.name}</dd></div>
                <div><dt className="text-xs text-ink-500">Price</dt><dd className="font-medium text-ink-800">₹{formatPlanPrice(subscription.plan.price)}</dd></div>
                <div><dt className="text-xs text-ink-500">Status</dt><dd><StatusChip status={subscription.status} /></dd></div>
                <div><dt className="text-xs text-ink-500">Next Billing</dt><dd className="font-medium text-ink-800">{formatDate(subscription.nextBillingDate)}</dd></div>
                <div><dt className="text-xs text-ink-500">Razorpay Subscription ID</dt><dd className="font-mono text-xs text-ink-600">{subscription.razorpaySubscriptionId ?? "—"}</dd></div>
                <div><dt className="text-xs text-ink-500">Razorpay Customer ID</dt><dd className="font-mono text-xs text-ink-600">{company.razorpayCustomer?.razorpayCustomerId ?? "—"}</dd></div>
              </dl>

              <form action={changeCustomerPlan.bind(null, subscription.id)} className="flex items-end gap-2 border-t border-ink-100 pt-4">
                <label className="flex flex-1 flex-col gap-1">
                  <span className="text-xs text-ink-500">Change Plan</span>
                  <select name="planId" defaultValue={subscription.planId} className={inputClass}>
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>{plan.name}</option>
                    ))}
                  </select>
                </label>
                <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                  Apply
                </button>
              </form>

              <form action={extendSubscriptionAccess.bind(null, subscription.id)} className="flex items-end gap-2">
                <label className="flex flex-1 flex-col gap-1">
                  <span className="text-xs text-ink-500">Extend Access (days)</span>
                  <input type="number" name="days" min={1} defaultValue={30} className={inputClass} />
                </label>
                <button type="submit" className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-700 hover:border-brand-400">
                  Extend
                </button>
              </form>
            </>
          ) : (
            <p className="text-sm text-ink-500">No subscription yet.</p>
          )}
        </div>

        <div className="flex flex-col gap-4 rounded-xl2 border border-ink-100 bg-white p-6 shadow-card">
          <h2 className="text-sm font-semibold text-ink-900">License &amp; Devices</h2>
          {license ? (
            <>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-xs text-ink-500">License</dt><dd className="font-mono text-xs text-ink-800">{license.displayKey}</dd></div>
                <div><dt className="text-xs text-ink-500">Status</dt><dd><StatusChip status={license.status} /></dd></div>
                <div><dt className="text-xs text-ink-500">Device Limit</dt><dd className="font-medium text-ink-800">{license.deviceLimitOverride ?? subscription?.plan.deviceLimit ?? "—"}</dd></div>
                <div><dt className="text-xs text-ink-500">Active Devices</dt><dd className="font-medium text-ink-800">{license.devices.filter((d) => d.status === "ACTIVE").length}</dd></div>
              </dl>
              <ul className="flex flex-col divide-y divide-ink-100 border-t border-ink-100 pt-2">
                {license.devices.map((device) => (
                  <li key={device.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-ink-700">{device.deviceName ?? device.deviceId}</span>
                    <StatusChip status={device.status} />
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-ink-500">No license issued yet.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-xl2 border border-ink-100 bg-white p-6 shadow-card">
          <h2 className="text-sm font-semibold text-ink-900">Recent Payments</h2>
          {company.payments.length === 0 ? (
            <p className="text-sm text-ink-500">None yet.</p>
          ) : (
            company.payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-ink-700">₹{formatPlanPrice(p.amount)} · {formatDate(p.createdAt)}</span>
                <StatusChip status={p.status} />
              </div>
            ))
          )}
        </div>
        <div className="flex flex-col gap-3 rounded-xl2 border border-ink-100 bg-white p-6 shadow-card">
          <h2 className="text-sm font-semibold text-ink-900">Team</h2>
          {company.users.map((cu) => (
            <div key={cu.id} className="flex items-center justify-between text-sm">
              <span className="text-ink-700">{cu.user.firstName} {cu.user.lastName}</span>
              <span className="text-xs text-ink-500">{cu.role.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl2 border border-ink-100 bg-white p-6 shadow-card">
        <h2 className="mb-3 text-sm font-semibold text-ink-900">Audit History</h2>
        {company.auditLogs.length === 0 ? (
          <p className="text-sm text-ink-500">No admin actions recorded for this customer yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-ink-100">
            {company.auditLogs.map((log) => (
              <li key={log.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-ink-700">{log.action}</span>
                <span className="text-xs text-ink-500">{formatDate(log.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
