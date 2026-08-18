import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata: Metadata = {
  title: "Privacy Policy",
  robots: { index: false },
};

export default function PrivacyPage() {
  return (
    <section className="py-20 sm:py-28">
      <Container className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
        <SectionHeading
          eyebrow="Legal"
          title="Privacy Policy"
          description="A full Privacy Policy — covering what account, billing, device and usage data MediaCloud Studio collects and how it's used — will be published here before public launch. This placeholder exists so the site's navigation is complete during development."
        />
      </Container>
    </section>
  );
}
