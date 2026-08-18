import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import { getTemplates, getTemplateCategories, getCustomers } from "@/server/admin/queries";
import { createTemplate, assignTemplateToCompany } from "@/server/admin/actions";

export const metadata: Metadata = { title: "Templates" };
export const dynamic = "force-dynamic";

const inputClass = "w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500";

export default async function AdminTemplatesPage() {
  const [templates, categories, customers] = await Promise.all([getTemplates(), getTemplateCategories(), getCustomers()]);

  return (
    <>
      <PageHeader title="Templates" description={`${templates.length} InDesign templates in the library.`} />

      <div className="flex flex-col gap-4">
        {templates.map((template) => (
          <div key={template.id} className="flex flex-col gap-4 rounded-xl2 border border-ink-100 bg-white p-5 shadow-card sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-ink-900">{template.name}</span>
                <StatusChip status={template.status} />
              </div>
              <span className="text-xs text-ink-500">
                {template.category.label} · v{template.version} · assigned to {template.customerTemplates.length} customer(s)
              </span>
              {template.customerTemplates.length > 0 && (
                <span className="text-xs text-ink-400">
                  {template.customerTemplates.map((ct) => ct.company.companyName).join(", ")}
                </span>
              )}
            </div>

            <form action={async (formData: FormData) => { "use server"; await assignTemplateToCompany(template.id, formData); }} className="flex items-center gap-2">
              <select name="companyId" required className={`${inputClass} w-56`}>
                <option value="">Assign to customer…</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.companyName}
                  </option>
                ))}
              </select>
              <button type="submit" className="rounded-lg border border-ink-200 px-3 py-2 text-xs font-semibold text-ink-700 hover:border-brand-400">
                Assign
              </button>
            </form>
          </div>
        ))}
      </div>

      <form action={async (formData: FormData) => { "use server"; await createTemplate(formData); }} className="mt-6 flex flex-col gap-4 rounded-xl2 border border-dashed border-ink-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-ink-900">Add Template</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <input name="name" placeholder="Template Name" required className={inputClass} />
          <select name="categoryId" required className={inputClass}>
            <option value="">Category…</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
          <input name="version" placeholder="Version (e.g. 1.0.0)" defaultValue="1.0.0" required className={inputClass} />
          <input name="description" placeholder="Description (optional)" className={inputClass} />
        </div>
        <button type="submit" className="w-fit rounded-lg border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-700 hover:border-brand-400">
          Create Template
        </button>
      </form>
    </>
  );
}
