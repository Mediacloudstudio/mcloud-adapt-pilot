import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import { getPlans } from "@/server/admin/queries";
import { updatePlan, createPlan } from "@/server/admin/actions";

export const metadata: Metadata = { title: "Plans" };
export const dynamic = "force-dynamic";

const inputClass = "w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500";

export default async function AdminPlansPage() {
  const plans = await getPlans();

  return (
    <>
      <PageHeader title="Plans" description="Pricing shown on the public /pricing page reads directly from these rows — changes are live immediately, no deploy required." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <form
            key={plan.id}
            action={async (formData: FormData) => { "use server"; await updatePlan(plan.id, formData); }}
            className="flex flex-col gap-3 rounded-xl2 border border-ink-100 bg-white p-6 shadow-card"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-ink-400">{plan.code}</span>
              <StatusChip status={plan.status} />
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-xs text-ink-500">Name</span>
              <input name="name" defaultValue={plan.name} required className={inputClass} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-ink-500">Price (₹)</span>
              <input name="price" type="number" step="1" defaultValue={Number(plan.price)} required className={inputClass} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-ink-500">Device Limit</span>
              <input name="deviceLimit" type="number" min={1} defaultValue={plan.deviceLimit} required className={inputClass} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-ink-500">Billing Frequency</span>
              <select name="billingFrequency" defaultValue={plan.billingFrequency} className={inputClass}>
                <option value="MONTHLY">Monthly</option>
                <option value="ANNUAL">Annual</option>
                <option value="ONE_TIME">One-Time</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-ink-500">Status</span>
              <select name="status" defaultValue={plan.status} className={inputClass}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-ink-600">
              <input type="checkbox" name="isRecommended" defaultChecked={plan.isRecommended} />
              Show as &quot;Recommended&quot;
            </label>

            <button type="submit" className="mt-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              Save Plan
            </button>
          </form>
        ))}
      </div>

      <form action={async (formData: FormData) => { "use server"; await createPlan(formData); }} className="flex flex-col gap-4 rounded-xl2 border border-dashed border-ink-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-ink-900">Create New Plan</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <input name="code" placeholder="Plan Code (e.g. PLAN_5PC)" required className={inputClass} />
          <input name="name" placeholder="Plan Name" required className={inputClass} />
          <input name="price" type="number" placeholder="Price (₹)" required className={inputClass} />
          <input name="deviceLimit" type="number" placeholder="Device Limit" required className={inputClass} />
        </div>
        <select name="billingFrequency" defaultValue="ANNUAL" className={`${inputClass} sm:w-64`}>
          <option value="MONTHLY">Monthly</option>
          <option value="ANNUAL">Annual</option>
          <option value="ONE_TIME">One-Time</option>
          <option value="CUSTOM">Custom</option>
        </select>
        <button type="submit" className="w-fit rounded-lg border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-700 hover:border-brand-400">
          Create Plan
        </button>
      </form>
    </>
  );
}
