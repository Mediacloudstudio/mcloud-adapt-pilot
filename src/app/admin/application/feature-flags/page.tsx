import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { ActionButton } from "@/components/admin/action-button";
import { getFeatureFlags } from "@/server/admin/queries";
import { toggleFeatureFlag } from "@/server/admin/actions";

export const metadata: Metadata = { title: "Feature Flags" };
export const dynamic = "force-dynamic";

export default async function AdminFeatureFlagsPage() {
  const flags = await getFeatureFlags();

  return (
    <>
      <PageHeader
        title="Feature Flags"
        description="Read by the desktop client on every /api/v1/app/config call. Scope a flag to a single customer or plan, or leave it global."
      />

      <div className="overflow-x-auto rounded-xl2 border border-ink-100 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-100 bg-ink-50/60 text-left text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-5 py-3 font-medium">Code</th>
              <th className="px-5 py-3 font-medium">Scope</th>
              <th className="px-5 py-3 font-medium">Target</th>
              <th className="px-5 py-3 font-medium">Enabled</th>
              <th className="px-5 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {flags.map((flag) => (
              <tr key={flag.id} className="hover:bg-ink-50/60">
                <td className="px-5 py-3 font-mono text-xs font-medium text-ink-900">{flag.code}</td>
                <td className="px-5 py-3 text-ink-600">{flag.scope}</td>
                <td className="px-5 py-3 text-ink-500">{flag.company?.companyName ?? flag.plan?.name ?? "—"}</td>
                <td className="px-5 py-3 text-ink-600">{flag.enabled ? "Yes" : "No"}</td>
                <td className="px-5 py-3 text-right">
                  <ActionButton
                    action={toggleFeatureFlag.bind(null, flag.id, !flag.enabled)}
                    label={flag.enabled ? "Disable" : "Enable"}
                    variant={flag.enabled ? "outline" : "primary"}
                  />
                </td>
              </tr>
            ))}
            {flags.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-ink-400">
                  No feature flags configured yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
