import type { Metadata } from "next";
import { AdminSidebar } from "@/components/admin/sidebar";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getAdminContext } from "@/server/admin/context";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | MediaCloud Admin" },
  robots: { index: false },
};

// PART 61 — admin portal optimized for desktop/laptop, collapsible
// sidebar on smaller screens (AdminSidebar handles the mobile toggle).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { session } = await getAdminContext();

  return (
    <div className="flex min-h-screen bg-ink-50/40">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="hidden items-center justify-between border-b border-ink-100 bg-white px-8 py-4 lg:flex">
          <span className="text-sm text-ink-500">Signed in as {session.user.email} (Platform Admin)</span>
          <SignOutButton />
        </div>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
