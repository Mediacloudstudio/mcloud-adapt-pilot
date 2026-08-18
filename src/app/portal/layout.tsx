import type { Metadata } from "next";
import { PortalSidebar } from "@/components/portal/sidebar";
import { PortalTopbar } from "@/components/portal/topbar";
import { getPortalContext } from "@/server/portal/context";

export const metadata: Metadata = {
  title: { default: "Customer Portal", template: "%s | MCloud Adapt Pilot Portal" },
  robots: { index: false },
};

// PART 61 — the portal is optimized primarily for desktop/laptop but
// stays responsive (mobile gets a collapsible sidebar via PortalSidebar).
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const { session, company } = await getPortalContext();

  return (
    <div className="flex min-h-screen bg-ink-50/40">
      <PortalSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <PortalTopbar companyName={company.companyName} userName={session.user.firstName} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto flex max-w-6xl flex-col gap-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
