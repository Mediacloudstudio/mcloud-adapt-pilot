"use client";

import { useFormState, useFormStatus } from "react-dom";
import { setDesktopHomeImage, type ActionResult } from "@/server/admin/actions";

const inputClass =
  "w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500";

const initialState: ActionResult = { success: true, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-fit rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Saving…" : "Save"}
    </button>
  );
}

export function HomeImageForm({ currentUrl }: { currentUrl: string }) {
  const [state, formAction] = useFormState(setDesktopHomeImage, initialState);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-4 rounded-xl2 border border-ink-100 bg-white p-6 shadow-card">
      {state.message && (
        <p className={`rounded-lg px-3 py-2 text-sm ${state.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {state.message}
        </p>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-xs text-ink-500">Image URL - leave blank to automatically use your active Banner&rsquo;s image instead</span>
        <input
          name="desktopHomeImageUrl"
          defaultValue={currentUrl}
          placeholder="https://mydesignpilot.com/banners/home-screen.jpg"
          className={inputClass}
        />
      </label>

      {currentUrl && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-ink-500">Current image:</span>
          {/* eslint-disable-next-line @next/next/no-img-element -- admin-supplied arbitrary external URL, not worth a next/image domain allowlist for an internal preview */}
          <img src={currentUrl} alt="" className="h-16 w-28 rounded-lg border border-ink-100 object-cover" />
        </div>
      )}

      <SubmitButton />
    </form>
  );
}
