import type { Metadata } from "next";
import { ComingSoonSection } from "@/components/marketing/coming-soon";

export const metadata: Metadata = {
  title: "Resources",
  description: "Guides, case studies and best practices for automating creative production with MCloud Adapt Pilot.",
};

export default function ResourcesPage() {
  return (
    <ComingSoonSection
      eyebrow="Resources"
      title="Guides and case studies are on the way"
      description="This section will hold template-automation best practices, customer case studies, and campaign-localization playbooks as they're published."
      phaseNote="Content hub — scheduled after the core platform phases (1–9) ship"
      items={[
        {
          title: "Template Automation Best Practices",
          description: "How to structure InDesign frames so they adapt cleanly across sizes and languages.",
        },
        {
          title: "Customer Case Studies",
          description: "How agencies, brand teams and retail marketers use Adapt Pilot in production.",
        },
        {
          title: "Localization Playbooks",
          description: "Patterns for running one campaign across many markets and languages at once.",
        },
      ]}
    />
  );
}
