import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import { formatPlanPrice } from "@/lib/plans";
import { getPortalContext } from "@/server/portal/context";
import { getInvoices } from "@/server/portal/queries";

export const metadata: Metadata = { title: "Invoices" };
export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const { companyId } = await getPortalContext();
  const invoices = await getInvoices(companyId);

  return (
    <>
      <PageHeader title="Invoices" description="Tax invoices for every billed payment." />

      <div className="overflow-x-auto rounded-xl2 border border-ink-100 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-100 bg-ink-50/60 text-left text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-5 py-3 font-medium">Invoice Number</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Base Amount</th>
              <th className="px-5 py-3 font-medium">Tax</th>
              <th className="px-5 py-3 font-medium">Total</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">PDF</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-ink-500">
                  No invoices yet.
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-5 py-3 font-mono text-xs text-ink-800">{invoice.invoiceNumber}</td>
                  <td className="px-5 py-3 text-ink-600">
                    {new Date(invoice.invoiceDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3 text-ink-600">₹{formatPlanPrice(invoice.subtotal)}</td>
                  <td className="px-5 py-3 text-ink-600">₹{formatPlanPrice(invoice.taxAmount)}</td>
                  <td className="px-5 py-3 font-medium text-ink-900">₹{formatPlanPrice(invoice.total)}</td>
                  <td className="px-5 py-3">
                    <StatusChip status={invoice.status} />
                  </td>
                  <td className="px-5 py-3">
                    {invoice.pdfUrl ? (
                      <a href={invoice.pdfUrl} className="font-semibold text-brand-700 hover:underline">
                        Download
                      </a>
                    ) : (
                      <span className="text-xs text-ink-400">PDF generation ships with Phase 6</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
