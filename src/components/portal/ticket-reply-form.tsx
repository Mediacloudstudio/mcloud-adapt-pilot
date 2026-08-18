"use client";

import { useRef, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { replyToTicket } from "@/server/portal/actions";

export function TicketReplyForm({ ticketId }: { ticketId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={(formData) =>
        startTransition(async () => {
          await replyToTicket(ticketId, formData);
          formRef.current?.reset();
        })
      }
      className="flex flex-col gap-3"
    >
      <textarea
        name="message"
        required
        rows={3}
        placeholder="Write a reply..."
        className="rounded-lg border border-ink-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
      />
      <Button type="submit" disabled={pending} size="md" className="w-fit">
        {pending ? "Sending..." : "Send Reply"}
      </Button>
    </form>
  );
}
