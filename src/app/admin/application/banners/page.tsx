import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import { getBanners } from "@/server/admin/queries";
import { createBanner } from "@/server/admin/actions";

export const metadata: Metadata = { title: "Banners" };
export const dynamic = "force-dynamic";

const inputClass = "w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500";

export default async function AdminBannersPage() {
  const banners = await getBanners();

  return (
    <>
      <PageHeader title="Banners" description="Shown inside the customer portal and, when configured, inside the desktop app itself." />

      <div className="flex flex-col gap-3">
        {banners.map((banner) => (
          <div key={banner.id} className="flex flex-col gap-1 rounded-xl2 border border-ink-100 bg-white p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-ink-900">{banner.title}</span>
                <StatusChip status={banner.status} />
              </div>
              {banner.subtitle && <p className="text-sm text-ink-500">{banner.subtitle}</p>}
              {banner.linkUrl && <p className="text-xs text-ink-400">{banner.linkUrl}</p>}
            </div>
            <span className="text-xs text-ink-400">{new Date(banner.createdAt).toLocaleDateString("en-IN")}</span>
          </div>
        ))}
        {banners.length === 0 && <p className="text-sm text-ink-400">No banners yet.</p>}
      </div>

      <form action={createBanner} className="mt-6 flex flex-col gap-4 rounded-xl2 border border-dashed border-ink-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-ink-900">Create Banner</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <input name="title" placeholder="Title" required className={inputClass} />
          <input name="linkUrl" placeholder="Link URL (optional)" className={inputClass} />
        </div>
        <input name="subtitle" placeholder="Subtitle (optional)" className={inputClass} />
        <select name="status" defaultValue="ACTIVE" className={`${inputClass} sm:w-48`}>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <button type="submit" className="w-fit rounded-lg border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-700 hover:border-brand-400">
          Create Banner
        </button>
      </form>
    </>
  );
}
