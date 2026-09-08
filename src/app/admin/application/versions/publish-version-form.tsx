"use client";

import { useFormState, useFormStatus } from "react-dom";
import { publishAppVersion, type ActionResult } from "@/server/admin/actions";

const inputClass = "w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500";

const initialState: ActionResult = { success: true, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-fit rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Publishing…" : "Publish Version"}
    </button>
  );
}

export function PublishVersionForm() {
  const [state, formAction] = useFormState(publishAppVersion, initialState);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4 rounded-xl2 border border-dashed border-ink-200 bg-white p-6">
      <h2 className="text-sm font-semibold text-ink-900">Publish New Version</h2>

      {state.message && (
        <p className={`rounded-lg px-3 py-2 text-sm ${state.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {state.message}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <input name="version" placeholder="Version (e.g. 2.4.0)" autoComplete="off" pattern="\d+\.\d+\.\d+" title="Digits and dots only, e.g. 1.1.0" required className={inputClass} />
        <input name="minimumSupportedVersion" placeholder="Minimum Supported (e.g. 2.0.0)" autoComplete="off" pattern="\d+\.\d+\.\d+" title="Digits and dots only, e.g. 1.0.0" required className={inputClass} />
        <input name="installerUrl" type="url" placeholder="Installer URL" required className={inputClass} />
      </div>
      <textarea name="releaseNotes" placeholder="Release notes (optional)" rows={3} className={inputClass} />
      <label className="flex items-center gap-2 text-sm text-ink-600">
        <input type="checkbox" name="mandatory" />
        Mandatory update — block older clients until they update
      </label>
      <SubmitButton />
    </form>
  );
}
