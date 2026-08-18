import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import { formatPlanPrice } from "@/lib/plans";
import { getPayments } from "@/server/admin/queries";

export const metadata: Metadata = { title: "Payments" };
export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const payments = await getPayments();

  return (
    <>
      <PageHeader title="Payments" description={`${payments.length} payment records.`} />
      <div className="overflow-x-auto rounded-xl2 border border-ink-100 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-100 bg-ink-50/60 text-left text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Razorpay Payment ID</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Invoice</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {payments.map((payment) => (
              <tr key={payment.id} className="hover:bg-ink-50/60">
                <td className="px-5 py-3 text-ink-600">{new Date(payment.createdAt).toLocaleDateString("en-IN")}</td>
                <td className="px-5 py-3">
                  <Link href={`/admin/customers/${payment.companyId}`} className="font-medium text-brand-700 hover:underline">
                    {payment.company.companyName}
                  </Link>
                </td>
                <td className="px-5 py-3 font-mono text-xs text-ink-500">{payment.razorpayPaymentId ?? "—"}</td>
                <td className="px-5 py-3 font-medium text-ink-900">₹{formatPlanPrice(payment.amount)}</td>
                <td className="px-5 py-3"><StatusChip status={payment.status} /></td>
                <td className="px-5 py-3 text-ink-500">{payment.invoice?.invoiceNumber ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
