import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/marketing/logo";
import { footerColumns } from "@/lib/content/nav";

export function Footer() {
  return (
    <footer className="border-t border-ink-100 bg-ink-950 text-ink-300">
      <Container className="py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="flex flex-col gap-4">
            <Logo variant="dark" />
            <p className="max-w-xs text-sm text-ink-400">
              Automated Adobe InDesign creative production for enterprise teams — built by
              MediaCloud Studio Pvt Ltd.
            </p>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title} className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-white">{column.title}</h3>
              <ul className="flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-ink-400 hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-8 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} MediaCloud Studio Pvt Ltd. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/legal/terms" className="hover:text-ink-300">
              Terms of Service
            </Link>
            <Link href="/legal/privacy" className="hover:text-ink-300">
              Privacy Policy
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
