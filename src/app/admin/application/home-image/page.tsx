import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { getAppSettings } from "@/server/admin/queries";
import { HomeImageForm } from "./home-image-form";

export const metadata: Metadata = { title: "Home Screen" };
export const dynamic = "force-dynamic";

export default async function AdminHomeImagePage() {
  const settings = await getAppSettings();
  const currentUrl = settings.desktopHomeImageUrl ?? "";

  return (
    <>
      <PageHeader
        title="Home Screen"
        description="The picture shown on the desktop app's Home page. Left blank, it automatically matches your active Banner's image (Admin -> Application -> Banners) - set one here only if you want the Home page to show something different from the banner. Every device picks up a change within an hour (or immediately on next launch)."
      />
      <HomeImageForm currentUrl={currentUrl} />
    </>
  );
}
