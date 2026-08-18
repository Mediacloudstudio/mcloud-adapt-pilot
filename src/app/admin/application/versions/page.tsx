import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { getAppVersions } from "@/server/admin/queries";
import { publishAppVersion } from "@/server/admin/actions";

export const metadata: Metadata = { title: "Application Versions" };
export const dynamic = "force-dynamic";

const inputClass = "w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500";

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

      <form action={async (formData: FormData) => { "use server"; await publishAppVersion(formData); }} className="mt-6 flex flex-col gap-4 rounded-xl2 border border-dashed border-ink-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-ink-900">Publish New Version</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <input name="version" placeholder="Version (e.g. 2.4.0)" required className={inputClass} />
          <input name="minimumSupportedVersion" placeholder="Minimum Supported (e.g. 2.0.0)" required className={inputClass} />
          <input name="installerUrl" type="url" placeholder="Installer URL" required className={inputClass} />
        </div>
        <textarea name="releaseNotes" placeholder="Release notes (optional)" rows={3} className={inputClass} />
        <label className="flex items-center gap-2 text-sm text-ink-600">
          <input type="checkbox" name="mandatory" />
          Mandatory update — block older clients until they update
        </label>
        <button type="submit" className="w-fit rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          Publish Version
        </button>
      </form>
    </>
  );
}
