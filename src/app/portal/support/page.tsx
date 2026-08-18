import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import { NewTicketForm } from "@/components/portal/new-ticket-form";
import { getPortalContext } from "@/server/portal/context";
import { getTickets } from "@/server/portal/queries";

export const metadata: Metadata = { title: "Support" };
export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const { companyId } = await getPortalContext();
  const tickets = await getTickets(companyId);

  return (
    <>
      <PageHeader title="Support" description="Submit a ticket or check the status of an existing one." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.3fr]">
        <NewTicketForm />

        <div className="flex flex-col gap-4 rounded-xl2 border border-ink-100 bg-white p-6 shadow-card">
          <h2 className="text-sm font-semibold text-ink-900">My Tickets</h2>
          {tickets.length === 0 ? (
            <p className="text-sm text-ink-500">No tickets yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-ink-100">
              {tickets.map((ticket) => (
                <li key={ticket.id}>
                  <Link
                    href={`/portal/support/${ticket.id}`}
                    className="flex items-center justify-between gap-3 py-3 text-sm hover:bg-ink-50/60"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-ink-800">{ticket.subject}</span>
                      <span className="text-xs text-ink-500">
                        #{ticket.id.slice(-6).toUpperCase()} · {ticket.category} · {ticket.priority}
                      </span>
                    </div>
                    <StatusChip status={ticket.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
