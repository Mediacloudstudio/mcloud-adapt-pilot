"use client";

// The "Application" sidebar link only ever pointed at /versions - the
// Banners and Feature Flags pages existed with real working forms, but
// nothing in the UI linked to them, so the only way in was to already
// know (or be told) the exact URL. This tab bar makes all three
// reachable by clicking, shared across the three pages via layout.tsx.

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Versions", href: "/admin/application/versions" },
  { label: "Banners", href: "/admin/application/banners" },
  { label: "Home Screen", href: "/admin/application/home-image" },
  { label: "Feature Flags", href: "/admin/application/feature-flags" },
];

export function ApplicationTabs() {
  const pathname = usePathname();

  return (
    <div className="mb-6 flex gap-1 border-b border-ink-100">
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              active ? "border-brand-500 text-brand-600" : "border-transparent text-ink-500 hover:text-ink-800"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
