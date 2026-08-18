import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { ButtonLink } from "@/components/ui/button";

export function ComingSoonSection({
  eyebrow,
  title,
  description,
  phaseNote,
  items,
  cta,
}: {
  eyebrow: string;
  title: string;
  description: string;
  phaseNote: string;
  items?: { title: string; description: string }[];
  cta?: { label: string; href: string };
}) {
  return (
    <>
      <section className="bg-gradient-to-b from-brand-50/70 to-white py-20 sm:py-28">
        <Container className="flex flex-col items-center gap-6 text-center">
          <SectionHeading eyebrow={eyebrow} title={title} description={description} />
          <span className="rounded-full border border-ink-200 bg-white px-4 py-1.5 text-xs font-medium text-ink-500">
            {phaseNote}
          </span>
        </Container>
      </section>

      {items && items.length > 0 && (
        <section className="pb-24">
          <Container>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <div key={item.title} className="flex flex-col gap-2 rounded-xl2 border border-ink-100 bg-white p-6 shadow-card">
                  <h3 className="text-sm font-semibold text-ink-900">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-ink-600">{item.description}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>
      )}

      {cta && (
        <section className="pb-24">
          <Container className="flex justify-center">
            <ButtonLink href={cta.href} size="lg">
              {cta.label}
            </ButtonLink>
          </Container>
        </section>
      )}
    </>
  );
}

export function PlainSection({ children }: { children: ReactNode }) {
  return (
    <section className="pb-24">
      <Container>{children}</Container>
    </section>
  );
}
