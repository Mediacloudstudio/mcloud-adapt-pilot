"use client";

// Split out of page.tsx (a Server Component) so this form can actually
// show the result of createBanner() - the previous inline version threw
// the ActionResult away entirely, so a validation failure (e.g. a bad
// Image URL) looked exactly like the click did nothing at all.

import { useFormState, useFormStatus } from "react-dom";
import { createBanner, type ActionResult } from "@/server/admin/actions";

const inputClass =
  "w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500";

const initialState: ActionResult = { success: true, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-fit rounded-lg border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-700 hover:border-brand-400 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Creating…" : "Create Banner"}
    </button>
  );
}

export function CreateBannerForm() {
  const [state, formAction] = useFormState(createBanner, initialState);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4 rounded-xl2 border border-dashed border-ink-200 bg-white p-6">
      <h2 className="text-sm font-semibold text-ink-900">Create Banner</h2>

      {state.message && (
        <p className={`rounded-lg px-3 py-2 text-sm ${state.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {state.message}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input name="title" placeholder="Title" required className={inputClass} />
        <input name="linkUrl" placeholder="Link URL (optional) - e.g. https://mydesignpilot.com/whats-new" className={inputClass} />
      </div>
      <input name="subtitle" placeholder="Subtitle (optional)" className={inputClass} />
      <input
        name="imageUrl"
        placeholder="Image URL (optional) - e.g. https://mydesignpilot.com/banners/promo.jpg"
        className={inputClass}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-ink-500">
          Start date (optional - blank means show immediately)
          <input type="date" name="startDate" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-500">
          End date (optional - blank means no expiry)
          <input type="date" name="endDate" className={inputClass} />
        </label>
      </div>
      <select name="status" defaultValue="ACTIVE" className={`${inputClass} sm:w-48`}>
        <option value="ACTIVE">Active</option>
        <option value="INACTIVE">Inactive</option>
      </select>
      <SubmitButton />
    </form>
  );
}
