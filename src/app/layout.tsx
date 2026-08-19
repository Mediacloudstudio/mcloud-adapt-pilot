import type { Metadata } from "next";
import { env } from "@/lib/env";
import "./globals.css";

// PART 60 — SEO defaults for the public site. Portal/admin route groups
// (added in later phases) will override this with `robots: { index: false }`.
export const metadata: Metadata = {
  // Read through the validated `env` (not raw `process.env`) — it already
  // normalizes a blank-but-present NEXT_PUBLIC_APP_URL down to its default,
  // which a plain `?? "..."` fallback doesn't do for an empty string.
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: {
    default: "MCloud Adapt Pilot | Design Once. Deliver Everywhere.",
    template: "%s | MCloud Adapt Pilot",
  },
  description:
    "MCloud Adapt Pilot transforms Adobe InDesign templates into intelligent, automated production workflows — generate multiple sizes, versions, languages and personalized outputs faster while maintaining complete brand consistency.",
  openGraph: {
    title: "MCloud Adapt Pilot | Design Once. Deliver Everywhere.",
    description:
      "Automated Adobe InDesign creative production for enterprise teams — built by MediaCloud Studio Pvt Ltd.",
    siteName: "MCloud Adapt Pilot",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
