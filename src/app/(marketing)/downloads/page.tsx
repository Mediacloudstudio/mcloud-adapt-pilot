import type { Metadata } from "next";
import { ComingSoonSection } from "@/components/marketing/coming-soon";

export const metadata: Metadata = {
  title: "Downloads",
  description: "Download the MCloud Adapt Pilot desktop application — available to active subscribers.",
};

export default function DownloadsPage() {
  return (
    <ComingSoonSection
      eyebrow="Downloads"
      title="The installer is available to active subscribers"
      description="MCloud Adapt Pilot's desktop installer is only released to customers with an active subscription and a valid license — the download link is signed and expires, and every download is recorded (PART 59). Log in to your customer portal to download the current version."
      phaseNote="Full secure download flow ships in Phase 4 (customer portal) and Phase 8 (signed URLs)"
      items={[
        {
          title: "Sign in required",
          description: "The installer link is generated per-account after checking your subscription and license status.",
        },
        {
          title: "Always the latest release",
          description: "Your portal always shows the current version, release notes and the installation guide.",
        },
        {
          title: "Windows 10 / Windows 11",
          description: "macOS support for the desktop application is on the roadmap (PART 67).",
        },
      ]}
      cta={{ label: "Log In to Download", href: "/login" }}
    />
  );
}
