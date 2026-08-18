"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { updateProfile, updateBillingProfile, changePassword } from "@/server/portal/actions";

const inputClass =
  "rounded-lg border border-ink-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500";

export function ProfileForm({ firstName, lastName, phone }: { firstName: string; lastName: string; phone: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          const result = await updateProfile(formData);
          setMessage(result.message);
        })
      }
      className="flex flex-col gap-4 rounded-xl2 border border-ink-100 bg-white p-6 shadow-card"
    >
      <h2 className="text-sm font-semibold text-ink-900">Profile</h2>
      {message && <p className="rounded-lg bg-ink-50 px-3.5 py-2.5 text-sm text-ink-600">{message}</p>}
      <div className="grid grid-cols-2 gap-4">
        <input name="firstName" defaultValue={firstName} required className={inputClass} placeholder="First Name" />
        <input name="lastName" defaultValue={lastName} required className={inputClass} placeholder="Last Name" />
      </div>
      <input name="phone" defaultValue={phone} className={inputClass} placeholder="Phone" />
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Saving..." : "Save Profile"}
      </Button>
    </form>
  );
}

export function BillingProfileForm({
  legalName,
  gstin,
  billingAddress,
  state,
  pinCode,
  country,
}: {
  legalName: string;
  gstin: string;
  billingAddress: string;
  state: string;
  pinCode: string;
  country: string;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          const result = await updateBillingProfile(formData);
          setMessage(result.message);
        })
      }
      className="flex flex-col gap-4 rounded-xl2 border border-ink-100 bg-white p-6 shadow-card"
    >
      <h2 className="text-sm font-semibold text-ink-900">Billing Information</h2>
      {message && <p className="rounded-lg bg-ink-50 px-3.5 py-2.5 text-sm text-ink-600">{message}</p>}
      <input name="legalName" defaultValue={legalName} className={inputClass} placeholder="Legal Company Name" />
      <input name="gstin" defaultValue={gstin} className={inputClass} placeholder="GSTIN" />
      <input name="billingAddress" defaultValue={billingAddress} className={inputClass} placeholder="Billing Address" />
      <div className="grid grid-cols-3 gap-4">
        <input name="state" defaultValue={state} className={inputClass} placeholder="State" />
        <input name="pinCode" defaultValue={pinCode} className={inputClass} placeholder="PIN Code" />
        <input name="country" defaultValue={country} required className={inputClass} placeholder="Country" />
      </div>
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Saving..." : "Save Billing Info"}
      </Button>
    </form>
  );
}

export function ChangePasswordForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          const result = await changePassword(formData);
          setMessage(result.message);
        })
      }
      className="flex flex-col gap-4 rounded-xl2 border border-ink-100 bg-white p-6 shadow-card"
    >
      <h2 className="text-sm font-semibold text-ink-900">Change Password</h2>
      {message && <p className="rounded-lg bg-ink-50 px-3.5 py-2.5 text-sm text-ink-600">{message}</p>}
      <input name="currentPassword" type="password" required className={inputClass} placeholder="Current Password" />
      <input name="newPassword" type="password" required className={inputClass} placeholder="New Password" />
      <input name="confirmPassword" type="password" required className={inputClass} placeholder="Confirm New Password" />
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Updating..." : "Update Password"}
      </Button>
    </form>
  );
}
