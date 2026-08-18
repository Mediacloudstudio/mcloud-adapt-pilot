import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import { formatPlanPrice } from "@/lib/plans";
import { getRefunds, getPayments } from "@/server/admin/queries";
import { createRefund } from "@/server/admin/actions";

export const metadata: Metadata = { title: "Refunds" };
export const dynamic = "force-dynamic";

const inputClass = "w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500";

export default async function AdminRefundsPage() {
  const [refunds, payments] = await Promise.all([getRefunds(), getPayments()]);
  const refundablePayments = payments.filter((payment) => payment.status === "PAID" || payment.status === "PARTIALLY_REFUNDED");

  return (
    <>
      <PageHeader
        title="Refunds"
        description="Recording a refund here updates the payment's status immediately. Actually moving money still happens in the Razorpay dashboard until Phase 6 automates it."
      />

      <div className="overflow-x-auto rounded-xl2 border border-ink-100 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-100 bg-ink-50/60 text-left text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Reason</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {refunds.map((refund) => (
              <tr key={refund.id} className="hover:bg-ink-50/60">
                <td className="px-5 py-3 text-ink-600">{new Date(refund.createdAt).toLocaleDateString("en-IN")}</td>
                <td className="px-5 py-3">
                  <Link href={`/admin/customers/${refund.payment.companyId}`} className="font-medium text-brand-700 hover:underline">
                    {refund.payment.company.companyName}
                  </Link>
                </td>
                <td className="px-5 py-3 font-medium text-ink-900">₹{formatPlanPrice(refund.amount)}</td>
                <td className="px-5 py-3 text-ink-500">{refund.reason ?? "—"}</td>
                <td className="px-5 py-3"><StatusChip status={refund.status} /></td>
              </tr>
            ))}
            {refunds.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-ink-400">
                  No refunds recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 rounded-xl2 border border-dashed border-ink-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-ink-900">Issue a Refund</h2>
        <p className="mt-1 text-xs text-ink-500">Only PAID or partially-refunded payments are shown below.</p>
        <div className="mt-4 flex flex-col gap-3">
          {refundablePayments.map((payment) => (
            <form
              key={payment.id}
              action={async (formData: FormData) => { "use server"; await createRefund(payment.id, formData); }}
              className="flex flex-col gap-2 rounded-lg border border-ink-100 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="text-sm">
                <span className="font-medium text-ink-900">{payment.company.companyName}</span>{" "}
                <span className="text-ink-500">— ₹{formatPlanPrice(payment.amount)} paid {new Date(payment.createdAt).toLocaleDateString("en-IN")}</span>
              </div>
              <div className="flex items-center gap-2">
                <input name="amount" type="number" step="0.01" placeholder="Amount (₹)" required className={`${inputClass} w-32`} />
                <input name="reason" placeholder="Reason (optional)" className={`${inputClass} w-48`} />
                <button type="submit" className="rounded-lg border border-ink-200 px-3 py-2 text-xs font-semibold text-ink-700 hover:border-brand-400">
                  Refund
                </button>
              </div>
            </form>
          ))}
          {refundablePayments.length === 0 && <p className="text-sm text-ink-400">No eligible payments right now.</p>}
        </div>
      </div>
    </>
  );
}
