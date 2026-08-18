import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import { getAdminTicket } from "@/server/admin/queries";
import { adminReplyToTicket } from "@/server/admin/actions";

export const metadata: Metadata = { title: "Ticket" };
export const dynamic = "force-dynamic";

const inputClass = "w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500";

export default async function AdminTicketDetailPage({ params }: { params: { ticketId: string } }) {
  const ticket = await getAdminTicket(params.ticketId);

  if (!ticket) {
    notFound();
  }

  return (
    <>
      <PageHeader
        title={ticket.subject}
        description={`${ticket.company.companyName} · #${ticket.id.slice(-6).toUpperCase()} · ${ticket.category} · ${ticket.priority}`}
        actions={<StatusChip status={ticket.status} />}
      />

      <div className="flex flex-col gap-4 rounded-xl2 border border-ink-100 bg-white p-6 shadow-card">
        <div className="rounded-lg bg-ink-50/60 p-4 text-sm text-ink-700">
          <p className="mb-1 text-xs font-semibold text-ink-500">
            {ticket.user.firstName} {ticket.user.lastName} · {ticket.user.email}
          </p>
          <p className="whitespace-pre-wrap">{ticket.description}</p>
        </div>

        {ticket.replies.map((reply) => (
          <div
            key={reply.id}
            className={`rounded-lg p-4 text-sm ${reply.isAdminReply ? "bg-brand-50 text-brand-900" : "bg-ink-50/60 text-ink-700"}`}
          >
            <p className="mb-1 text-xs font-semibold text-ink-500">
              {reply.isAdminReply ? "MediaCloud Support" : `${reply.author.firstName} ${reply.author.lastName}`}
            </p>
            <p className="whitespace-pre-wrap">{reply.message}</p>
          </div>
        ))}

        {ticket.status !== "CLOSED" && (
          <form action={adminReplyToTicket.bind(null, ticket.id)} className="flex flex-col gap-3 border-t border-ink-100 pt-4">
            <textarea name="message" placeholder="Write a reply…" rows={4} required className={inputClass} />
            <div className="flex items-center gap-3">
              <select name="status" defaultValue="WAITING_FOR_CUSTOMER" className={`${inputClass} w-56`}>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="WAITING_FOR_CUSTOMER">Waiting for Customer</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
              <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                Send Reply
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
