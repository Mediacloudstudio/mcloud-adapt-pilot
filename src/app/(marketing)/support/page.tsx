import type { Metadata } from "next";
import { Mail, MessageSquare, LifeBuoy } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Support",
  description: "Get help with MCloud Adapt Pilot — contact MediaCloud Studio or sign in to manage support tickets.",
};

const faqs = [
  {
    question: "How many computers can I activate?",
    answer:
      "That's controlled by your plan's device limit (1, 2 or 3 PCs on the standard plans). You can see your current usage and deactivate a device from your customer portal.",
  },
  {
    question: "What happens if my payment fails?",
    answer:
      "Your subscription moves to a short grace period during which the desktop app keeps working, then to a suspended state if payment isn't resolved. It reactivates automatically as soon as payment succeeds.",
  },
  {
    question: "Can I upgrade from 1 PC to 2 or 3 PCs later?",
    answer:
      "Yes — upgrading doesn't require a new license key. Your existing license's device allowance updates, and the desktop app picks it up on its next check.",
  },
  {
    question: "Does the website control Adobe InDesign directly?",
    answer:
      "No. The website only controls whether you're authorized to use MCloud Adapt Pilot. All InDesign automation happens locally through the desktop application.",
  },
];

export default function SupportPage() {
  return (
    <>
      <section className="bg-gradient-to-b from-brand-50/70 to-white py-20 sm:py-28">
        <Container className="flex flex-col items-center gap-6 text-center">
          <SectionHeading
            eyebrow="Support"
            title="We're here to help"
            description="For account-specific issues, sign in and open a ticket from your customer portal — our team can see your subscription, license and device details directly. For everything else, reach us below."
          />
        </Container>
      </section>

      <section className="pb-20">
        <Container>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="flex flex-col items-center gap-3 rounded-xl2 border border-ink-100 bg-white p-8 text-center shadow-card">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <MessageSquare className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <h3 className="text-sm font-semibold text-ink-900">Customer Portal Ticketing</h3>
              <p className="text-sm text-ink-600">
                Sign in for account-aware support with full ticket history.
              </p>
              <ButtonLink href="/login" variant="outline" size="md">
                Log In
              </ButtonLink>
            </div>

            <div className="flex flex-col items-center gap-3 rounded-xl2 border border-ink-100 bg-white p-8 text-center shadow-card">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <Mail className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <h3 className="text-sm font-semibold text-ink-900">Email</h3>
              <p className="text-sm text-ink-600">For general and pre-sales questions.</p>
              <a
                href="mailto:support@mediacloud.studio"
                className="text-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                support@mediacloud.studio
              </a>
            </div>

            <div className="flex flex-col items-center gap-3 rounded-xl2 border border-ink-100 bg-white p-8 text-center shadow-card">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <LifeBuoy className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <h3 className="text-sm font-semibold text-ink-900">Documentation</h3>
              <p className="text-sm text-ink-600">Setup guides and template preparation docs.</p>
              <ButtonLink href="/docs" variant="outline" size="md">
                View Docs
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      <section className="pb-24">
        <Container>
          <div className="mx-auto flex max-w-3xl flex-col gap-8">
            <SectionHeading title="Frequently Asked Questions" align="left" />
            <div className="flex flex-col divide-y divide-ink-100 rounded-xl2 border border-ink-100 bg-white">
              {faqs.map((faq) => (
                <div key={faq.question} className="flex flex-col gap-2 p-6">
                  <h3 className="text-sm font-semibold text-ink-900">{faq.question}</h3>
                  <p className="text-sm leading-relaxed text-ink-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
