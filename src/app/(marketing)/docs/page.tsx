import type { Metadata } from "next";
import { ComingSoonSection } from "@/components/marketing/coming-soon";

export const metadata: Metadata = {
  title: "Documentation",
  description: "Setup guides, template preparation docs, and API reference for MCloud Adapt Pilot.",
};

export default function DocsPage() {
  return (
    <ComingSoonSection
      eyebrow="Documentation"
      title="Documentation is published as each part of the platform ships"
      description="Full documentation — installation guides, template preparation, and the desktop application's API reference — is written alongside the phase that implements it, so nothing here gets ahead of what's actually built."
      phaseNote="Desktop integration reference ships in Phase 9; general guides follow the platform phases"
      items={[
        {
          title: "Getting Started",
          description: "Registering, choosing a plan, and activating your first device.",
        },
        {
          title: "Template Preparation Guide",
          description: "How to structure an InDesign template with automation-ready frames.",
        },
        {
          title: "Desktop Integration Reference",
          description: "How MCloud Adapt Pilot calls the license activation, validation and job APIs.",
        },
      ]}
      cta={{ label: "Contact Support", href: "/support" }}
    />
  );
}
