import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/seo/json-ld';
import { buildMetadata } from '@/lib/seo/metadata';
import { faqPage, graph } from '@/lib/seo/schema';
import { PricingTiers } from '@/components/pricing/pricing-tiers';

// SSG per CLAUDE.md §3. The tier cards are a client component: list prices
// render from static HTML, and the regional discount + checkout hydrate after
// load, so personalisation never makes this route dynamic.
export const dynamic = 'force-static';

export const metadata: Metadata = buildMetadata({
  title: 'Pricing',
  description:
    'One-time payments, no auto-renewal. Monthly $29, annual $79, lifetime $179. Around a third of every course is free to read without an account.',
  pathname: '/pricing',
  eyebrow: 'Pricing',
});

/**
 * FAQ content as data.
 *
 * The visible <dl> and the FAQPage JSON-LD are both rendered from this array.
 * Google requires the structured data to match what a user actually sees —
 * maintaining the answers in two places is how that requirement gets violated
 * without anyone noticing.
 */
const faqs = [
  {
    question: 'Does the monthly plan renew automatically?',
    answer:
      'No. It is a single payment granting 30 days of access. When it expires, access stops and nothing is charged again. Buy another if you want more time.',
  },
  {
    question: 'Is there regional pricing?',
    answer:
      'Yes — 50–60% off for India, Brazil and South East Asia, applied automatically based on your location.',
  },
  {
    question: 'Can I see the material before paying?',
    answer:
      'Around a third of every course is free and needs no account. Start with the free chapters and decide from there.',
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <JsonLd data={graph(faqPage(faqs, '/pricing'))} />

      {/* Answers the pricing question in the first 60 words (CLAUDE.md #12). */}
      <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        How much does it cost?
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-pretty text-[var(--fg-muted)]">
        Every plan is a one-time payment. Nothing auto-renews, and there is no card on file to
        cancel. Monthly is $29 for 30 days, annual is $79, lifetime is $179. Around a third of
        every course is free to read without an account.
      </p>

      <div className="mt-12">
        <PricingTiers />
      </div>

      <section className="mt-16 max-w-2xl" aria-labelledby="faq">
        <h2 id="faq" className="text-xl font-semibold tracking-tight">
          Common questions
        </h2>

        <dl className="mt-6 space-y-6">
          {faqs.map((faq) => (
            <div key={faq.question}>
              <dt className="font-medium">{faq.question}</dt>
              <dd className="mt-1 text-sm text-[var(--fg-muted)]">{faq.answer}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-6 text-sm text-[var(--fg-muted)]">
          <Link href="/courses" className="underline underline-offset-2">
            Start with the free chapters
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
