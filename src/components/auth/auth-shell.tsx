import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/marketing/logo";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-ink-50/60 px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-ink-100 bg-white p-8 shadow-premium sm:p-10">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <Logo />
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-ink-900">{title}</h1>
            {subtitle && <p className="text-sm text-ink-500">{subtitle}</p>}
          </div>
        </div>
        {children}
        {footer && <div className="mt-6 text-center text-sm text-ink-500">{footer}</div>}
      </div>
    </section>
  );
}

export function AuthLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-semibold text-brand-700 hover:text-brand-800">
      {children}
    </Link>
  );
}
