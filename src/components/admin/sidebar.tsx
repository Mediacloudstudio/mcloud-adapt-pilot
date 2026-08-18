"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { adminNav } from "@/lib/content/admin-nav";

export function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navList = (
    <nav className="flex flex-col gap-1 p-3">
      {adminNav.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active ? "bg-white/10 text-white" : "text-ink-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4" strokeWidth={1.9} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <div className="flex items-center justify-between border-b border-white/10 bg-ink-950 px-4 py-3 text-white lg:hidden">
        <span className="text-sm font-bold">MediaCloud Admin</span>
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className="rounded-md p-2"
          aria-label="Toggle admin navigation"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {mobileOpen && <div className="border-b border-white/10 bg-ink-950 lg:hidden">{navList}</div>}

      <aside className="hidden w-64 shrink-0 bg-ink-950 lg:flex lg:flex-col">
        <div className="border-b border-white/10 px-5 py-5">
          <span className="text-sm font-bold text-white">MediaCloud Admin</span>
          <p className="text-xs text-ink-400">MCloud Adapt Pilot</p>
        </div>
        {navList}
      </aside>
    </>
  );
}
