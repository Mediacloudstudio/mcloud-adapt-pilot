import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { getAppSettings } from "@/server/admin/queries";
import { updateAppSettings } from "@/server/admin/actions";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

const inputClass = "w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500";

export default async function AdminSettingsPage() {
  const settings = await getAppSettings();

  return (
    <>
      <PageHeader
        title="Settings"
        description="MediaCloud Studio Pvt Ltd's own billing identity — used on every invoice generated for customers (PART 32)."
      />

      <form action={async (formData: FormData) => { "use server"; await updateAppSettings(formData); }} className="flex max-w-2xl flex-col gap-4 rounded-xl2 border border-ink-100 bg-white p-6 shadow-card">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-ink-500">Legal Name</span>
          <input name="legalName" defaultValue={settings.legalName ?? ""} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-ink-500">GSTIN</span>
          <input name="gstin" defaultValue={settings.gstin ?? ""} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-ink-500">PAN</span>
          <input name="pan" defaultValue={settings.pan ?? ""} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-ink-500">Registered Address</span>
          <textarea name="registeredAddress" defaultValue={settings.registeredAddress ?? ""} rows={3} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-ink-500">State</span>
          <input name="state" defaultValue={settings.state ?? ""} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-ink-500">Invoice Number Prefix</span>
          <input name="invoicePrefix" defaultValue={settings.invoicePrefix ?? ""} placeholder="e.g. MCAP" className={inputClass} />
        </label>

        <button type="submit" className="mt-2 w-fit rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          Save Settings
        </button>
      </form>
    </>
  );
}
