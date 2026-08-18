import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import { formatPlanPrice } from "@/lib/plans";
import { getInvoices } from "@/server/admin/queries";

export const metadata: Metadata = { title: "Invoices" };
export const dynamic = "force-dynamic";

export default async function AdminInvoicesPage() {
  const invoices = await getInvoices();

  return (
    <>
      <PageHeader title="Invoices" description={`${invoices.length} invoices issued. GST breakdown is computed per invoice, not hard-coded.`} />
      <div className="overflow-x-auto rounded-xl2 border border-ink-100 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-100 bg-ink-50/60 text-left text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-5 py-3 font-medium">Invoice #</th>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Subtotal</th>
              <th className="px-5 py-3 font-medium">Tax</th>
              <th className="px-5 py-3 font-medium">Total</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-ink-50/60">
                <td className="px-5 py-3 font-mono text-xs font-medium text-ink-900">{invoice.invoiceNumber}</td>
                <td className="px-5 py-3">
                  <Link href={`/admin/customers/${invoice.companyId}`} className="font-medium text-brand-700 hover:underline">
                    {invoice.company.companyName}
                  </Link>
                </td>
                <td className="px-5 py-3 text-ink-600">{new Date(invoice.invoiceDate).toLocaleDateString("en-IN")}</td>
                <td className="px-5 py-3 text-ink-600">₹{formatPlanPrice(invoice.subtotal)}</td>
                <td className="px-5 py-3 text-ink-600">₹{formatPlanPrice(invoice.taxAmount)}</td>
                <td className="px-5 py-3 font-medium text-ink-900">₹{formatPlanPrice(invoice.total)}</td>
                <td className="px-5 py-3"><StatusChip status={invoice.status} /></td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-6 text-center text-ink-400">
                  No invoices issued yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
