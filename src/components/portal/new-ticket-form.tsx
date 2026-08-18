"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { submitSupportTicket } from "@/server/portal/actions";

const categories = ["Account", "Billing", "Devices & Licensing", "Templates", "Technical Issue", "Other"];
const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export function NewTicketForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={(formData) =>
        startTransition(async () => {
          const result = await submitSupportTicket(formData);
          setMessage(result.message);
          if (result.success) formRef.current?.reset();
        })
      }
      className="flex flex-col gap-4 rounded-xl2 border border-ink-100 bg-white p-6 shadow-card"
    >
      <h2 className="text-sm font-semibold text-ink-900">Submit a Ticket</h2>
      {message && <p className="rounded-lg bg-ink-50 px-3.5 py-2.5 text-sm text-ink-600">{message}</p>}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-700">Subject</span>
        <input name="subject" required className="rounded-lg border border-ink-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-700">Category</span>
          <select name="category" required className="rounded-lg border border-ink-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500">
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-700">Priority</span>
          <select name="priority" required defaultValue="MEDIUM" className="rounded-lg border border-ink-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500">
            {priorities.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-700">Description</span>
        <textarea name="description" required rows={4} className="rounded-lg border border-ink-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
      </label>

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Submitting..." : "Submit Ticket"}
      </Button>
    </form>
  );
}
