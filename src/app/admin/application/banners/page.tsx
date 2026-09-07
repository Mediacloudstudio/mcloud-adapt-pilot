import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import { getBanners } from "@/server/admin/queries";
import { setBannerStatus, deleteBanner } from "@/server/admin/actions";
import { CreateBannerForm } from "./create-banner-form";

export const metadata: Metadata = { title: "Banners" };
export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  const banners = await getBanners();

  return (
    <>
      <PageHeader title="Banners" description="Shown inside the customer portal and, when configured, inside the desktop app itself." />

      <div className="flex flex-col gap-3">
        {banners.map((banner) => (
          <div key={banner.id} className="flex flex-col gap-3 rounded-xl2 border border-ink-100 bg-white p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              {banner.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- admin-supplied arbitrary external URL, not worth a next/image domain allowlist for an internal thumbnail
                <img
                  src={banner.imageUrl}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-lg border border-ink-100 object-cover"
                />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ink-900">{banner.title}</span>
                  <StatusChip status={banner.status} />
                </div>
                {banner.subtitle && <p className="text-sm text-ink-500">{banner.subtitle}</p>}
                {banner.linkUrl && <p className="text-xs text-ink-400">{banner.linkUrl}</p>}
                {(banner.startDate || banner.endDate) && (
                  <p className="text-xs text-ink-400">
                    {banner.startDate ? new Date(banner.startDate).toLocaleDateString("en-IN") : "Always"}
                    {" → "}
                    {banner.endDate ? new Date(banner.endDate).toLocaleDateString("en-IN") : "No end date"}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-ink-400">{new Date(banner.createdAt).toLocaleDateString("en-IN")}</span>
              <form
                action={async () => {
                  "use server";
                  await setBannerStatus(banner.id, banner.status === "ACTIVE" ? "INACTIVE" : "ACTIVE");
                }}
              >
                <button
                  type="submit"
                  className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:border-brand-400"
                >
                  {banner.status === "ACTIVE" ? "Deactivate" : "Activate"}
                </button>
              </form>
              <form
                action={async () => {
                  "use server";
                  await deleteBanner(banner.id);
                }}
              >
                <button
                  type="submit"
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:border-red-400"
                >
                  Delete
                </button>
              </form>
            </div>
          </div>
        ))}
        {banners.length === 0 && <p className="text-sm text-ink-400">No banners yet.</p>}
      </div>

      <CreateBannerForm />
    </>
  );
}
