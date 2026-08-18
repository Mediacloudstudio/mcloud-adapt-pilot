import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import { getPortalContext } from "@/server/portal/context";
import { getCustomerTemplates } from "@/server/portal/queries";

export const metadata: Metadata = { title: "Templates" };
export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const { companyId } = await getPortalContext();
  const customerTemplates = await getCustomerTemplates(companyId);

  return (
    <>
      <PageHeader title="Templates" description="InDesign templates your account is authorized to run." />

      {customerTemplates.length === 0 ? (
        <div className="rounded-xl2 border border-ink-100 bg-white p-8 text-center text-sm text-ink-500 shadow-card">
          No templates have been assigned to your account yet. Contact support once your master template is ready
          for automation.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {customerTemplates.map(({ template, grantedAt }) => (
            <div key={template.id} className="flex flex-col gap-3 rounded-xl2 border border-ink-100 bg-white p-5 shadow-card">
              <div className="flex items-start justify-between">
                <span className="rounded-full border border-ink-200 px-2.5 py-0.5 text-xs font-medium text-ink-500">
                  {template.category.label}
                </span>
                <StatusChip status={template.status} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink-900">{template.name}</h3>
                <p className="text-xs text-ink-500">Version {template.version}</p>
              </div>
              {template.description && <p className="text-sm text-ink-600">{template.description}</p>}
              <p className="text-xs text-ink-400">
                Granted {new Date(grantedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
