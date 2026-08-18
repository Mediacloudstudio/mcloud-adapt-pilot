import { Header } from "@/components/marketing/header";
import { Footer } from "@/components/marketing/footer";

// Everything under the (marketing) route group shares the public site
// chrome. This group is intentionally separate from /portal and /admin
// (added in Phase 4/5), which get their own layouts with sidebars instead
// of this header/footer, and which are excluded from search indexing.
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
