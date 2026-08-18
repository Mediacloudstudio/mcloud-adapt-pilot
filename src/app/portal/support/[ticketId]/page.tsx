import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import { TicketReplyForm } from "@/components/portal/ticket-reply-form";
import { getPortalContext } from "@/server/portal/context";
import { getTicket } from "@/server/portal/queries";

export const metadata: Metadata = { title: "Ticket" };
export const dynamic = "force-dynamic";

export default async function TicketDetailPage({ params }: { params: { ticketId: string } }) {
  const { companyId } = await getPortalContext();
  const ticket = await getTicket(companyId, params.ticketId);

  if (!ticket) {
    notFound();
  }

  return (
    <>
      <PageHeader
        title={ticket.subject}
        description={`#${ticket.id.slice(-6).toUpperCase()} · ${ticket.category} · ${ticket.priority}`}
        actions={<StatusChip status={ticket.status} />}
      />

      <div className="flex flex-col gap-4 rounded-xl2 border border-ink-100 bg-white p-6 shadow-card">
        <div className="rounded-lg bg-ink-50/60 p-4 text-sm text-ink-700">
          <p className="mb-1 text-xs font-semibold text-ink-500">
            {ticket.user.firstName} {ticket.user.lastName}
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
          <div className="border-t border-ink-100 pt-4">
            <TicketReplyForm ticketId={ticket.id} />
          </div>
        )}
      </div>
    </>
  );
}
