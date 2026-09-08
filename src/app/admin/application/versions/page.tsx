import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { getAppVersions } from "@/server/admin/queries";
import { PublishVersionForm } from "./publish-version-form";

export const metadata: Metadata = { title: "Application Versions" };
export const dynamic = "force-dynamic";

export default async function AdminAppVersionsPage() {
  const versions = await getAppVersions();

  return (
    <>
      <PageHeader
        title="Application Versions"
        description="Every install of the desktop app checks GET /api/v1/app/version against these rows. Marking a release mandatory forces every device below minimumSupportedVersion to update before it can activate."
      />

      <div className="overflow-x-auto rounded-xl2 border border-ink-100 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-100 bg-ink-50/60 text-left text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-5 py-3 font-medium">Version</th>
              <th className="px-5 py-3 font-medium">Min. Supported</th>
              <th className="px-5 py-3 font-medium">Platform</th>
              <th className="px-5 py-3 font-medium">Mandatory</th>
              <th className="px-5 py-3 font-medium">Published</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {versions.map((version) => (
              <tr key={version.id} className="hover:bg-ink-50/60">
                <td className="px-5 py-3 font-mono text-xs font-medium text-ink-900">{version.version}</td>
                <td className="px-5 py-3 font-mono text-xs text-ink-500">{version.minimumSupportedVersion}</td>
                <td className="px-5 py-3 text-ink-600">{version.platform}</td>
                <td className="px-5 py-3 text-ink-600">{version.mandatory ? "Yes" : "No"}</td>
                <td className="px-5 py-3 text-ink-600">{new Date(version.publishedAt).toLocaleDateString("en-IN")}</td>
              </tr>
            ))}
            {versions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-ink-400">
                  No versions published yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PublishVersionForm />
    </>
  );
}
