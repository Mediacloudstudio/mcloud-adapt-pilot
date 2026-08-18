"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { inviteTeamMember } from "@/server/portal/actions";

export function InviteMemberForm({ roles }: { roles: { id: string; name: string }[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={(formData) =>
        startTransition(async () => {
          const result = await inviteTeamMember(formData);
          setMessage(result.message);
          if (result.success) formRef.current?.reset();
        })
      }
      className="flex flex-col gap-4 rounded-xl2 border border-ink-100 bg-white p-6 shadow-card"
    >
      <h2 className="text-sm font-semibold text-ink-900">Invite a Team Member</h2>
      {message && <p className="rounded-lg bg-ink-50 px-3.5 py-2.5 text-sm text-ink-600">{message}</p>}

      <div className="grid grid-cols-2 gap-4">
        <input name="firstName" placeholder="First Name" required className="rounded-lg border border-ink-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
        <input name="lastName" placeholder="Last Name" required className="rounded-lg border border-ink-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
      </div>
      <input name="email" type="email" placeholder="Email" required className="rounded-lg border border-ink-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
      <select name="roleId" required className="rounded-lg border border-ink-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500">
        {roles.map((role) => (
          <option key={role.id} value={role.id}>{role.name}</option>
        ))}
      </select>
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Sending..." : "Send Invite"}
      </Button>
    </form>
  );
}
