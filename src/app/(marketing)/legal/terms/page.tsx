import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata: Metadata = {
  title: "Terms of Service",
  robots: { index: false },
};

export default function TermsPage() {
  return (
    <section className="py-20 sm:py-28">
      <Container className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
        <SectionHeading
          eyebrow="Legal"
          title="Terms of Service"
          description="A full Terms of Service — covering subscription terms, licensing scope, acceptable use, and liability — will be published here before public launch. This placeholder exists so the site's navigation is complete during development."
        />
      </Container>
    </section>
  );
}
