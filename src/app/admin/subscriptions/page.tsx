import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import { formatPlanPrice } from "@/lib/plans";
import { getSubscriptions } from "@/server/admin/queries";

export const metadata: Metadata = { title: "Subscriptions" };
export const dynamic = "force-dynamic";

export default async function AdminSubscriptionsPage() {
  const subscriptions = await getSubscriptions();

  return (
    <>
      <PageHeader title="Subscriptions" description={`${subscriptions.length} subscriptions across all customers.`} />
      <div className="overflow-x-auto rounded-xl2 border border-ink-100 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-100 bg-ink-50/60 text-left text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Plan</th>
              <th className="px-5 py-3 font-medium">Price</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Next Billing</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {subscriptions.map((sub) => (
              <tr key={sub.id} className="hover:bg-ink-50/60">
                <td className="px-5 py-3">
                  <Link href={`/admin/customers/${sub.companyId}`} className="font-medium text-brand-700 hover:underline">
                    {sub.company.companyName}
                  </Link>
                </td>
                <td className="px-5 py-3 text-ink-600">{sub.plan.name}</td>
                <td className="px-5 py-3 text-ink-600">₹{formatPlanPrice(sub.plan.price)}</td>
                <td className="px-5 py-3"><StatusChip status={sub.status} /></td>
                <td className="px-5 py-3 text-ink-600">
                  {sub.nextBillingDate ? new Date(sub.nextBillingDate).toLocaleDateString("en-IN") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
