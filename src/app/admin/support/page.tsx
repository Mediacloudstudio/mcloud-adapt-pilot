import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import { getAllTickets } from "@/server/admin/queries";

export const metadata: Metadata = { title: "Support" };
export const dynamic = "force-dynamic";

export default async function AdminSupportPage() {
  const tickets = await getAllTickets();

  return (
    <>
      <PageHeader title="Support" description={`${tickets.length} tickets across all customers.`} />
      <div className="overflow-x-auto rounded-xl2 border border-ink-100 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-100 bg-ink-50/60 text-left text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-5 py-3 font-medium">Subject</th>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Priority</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-ink-50/60">
                <td className="px-5 py-3">
                  <Link href={`/admin/support/${ticket.id}`} className="font-medium text-brand-700 hover:underline">
                    {ticket.subject}
                  </Link>
                </td>
                <td className="px-5 py-3 text-ink-600">{ticket.company.companyName}</td>
                <td className="px-5 py-3 text-ink-600">{ticket.priority}</td>
                <td className="px-5 py-3"><StatusChip status={ticket.status} /></td>
                <td className="px-5 py-3 text-ink-500">{new Date(ticket.updatedAt).toLocaleDateString("en-IN")}</td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-ink-400">
                  No support tickets yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
