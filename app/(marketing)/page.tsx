import Link from 'next/link';
import type { Metadata } from 'next';
import { site } from '@/lib/site';
import { buildMetadata } from '@/lib/seo/metadata';

// Statically generated at build time and served from the CDN.
export const dynamic = 'force-static';

export const metadata: Metadata = buildMetadata({
  title: `${site.name} — ${site.tagline}`,
  description: site.description,
  pathname: '/',
});

const pillars = [
  {
    title: 'System design',
    body: 'Load balancers, consistent hashing, replication, queues — built up from why they exist, not memorised as a checklist.',
    href: '/courses/system-design',
  },
  {
    title: 'Low-level design',
    body: 'Object modelling, SOLID applied to real problems, and the design questions that get asked in practice.',
    href: '/courses/low-level-design',
  },
  {
    title: 'Data structures & algorithms',
    body: 'Patterns rather than problem counts. Learn the twenty shapes that the other five hundred questions reduce to.',
    href: '/courses/dsa',
  },
];

export default function HomePage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-20 pb-16 sm:px-6 sm:pt-28">
        {/*
          The first 60 words answer what this is and who it is for, per
          CLAUDE.md #12 and plan §11.4 — this is the text that gets extracted
          and cited by answer engines.
        */}
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          Interview preparation that explains the reasoning, not just the answer
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-pretty text-[var(--fg-muted)]">
          Courses on system design, low-level design, and data structures and algorithms,
          written as interactive chapters. Every trade-off is worked through in full, so you can
          defend a design under follow-up questions rather than recite one.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            href="/courses"
            className="rounded-lg bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--accent-fg)] transition-opacity hover:opacity-90"
          >
            Browse courses
          </Link>
          <Link
            href="/pricing"
            className="rounded-lg border border-[var(--border)] px-5 py-3 text-sm font-semibold transition-colors hover:bg-[var(--bg-subtle)]"
          >
            See pricing
          </Link>
        </div>

        <p className="mt-6 text-sm text-[var(--fg-muted)]">
          Around a third of every course is free to read, no account required.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6" aria-labelledby="what-you-learn">
        <h2 id="what-you-learn" className="text-2xl font-semibold tracking-tight">
          What can you learn here?
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {pillars.map((pillar) => (
            <Link
              key={pillar.href}
              href={pillar.href}
              className="rounded-xl border border-[var(--border)] p-6 transition-colors hover:bg-[var(--bg-subtle)]"
            >
              <h3 className="font-semibold">{pillar.title}</h3>
              <p className="mt-2 text-sm text-pretty text-[var(--fg-muted)]">{pillar.body}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
