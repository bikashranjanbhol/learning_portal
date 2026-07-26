import { siteUrl } from './env';

export const site = {
  name: 'Interview Prep',
  /** Used as the OG/Twitter site title and the metadata title template suffix. */
  tagline: 'System design, low-level design, and DSA — explained properly',
  description:
    'Interview preparation for system design, low-level design, and data structures and algorithms. Interactive explanations, worked examples, and the reasoning behind the answers.',
  get url() {
    return siteUrl();
  },
  author: {
    name: 'Bikashranjan',
    url: siteUrl(),
  },
  // Only routes that exist. A nav link to a 404 is worse than a missing link —
  // it wastes crawl budget and looks broken to the first visitor who clicks it.
  // Add /practice here when Sprint 4 ships it; /about, /terms, /privacy and
  // /refunds when those pages are written (the refund policy is required by
  // Stripe before launch — see plan §11.8).
  nav: [
    { href: '/courses', label: 'Courses' },
    { href: '/blog', label: 'Blog' },
    { href: '/pricing', label: 'Pricing' },
  ],
  footer: {
    product: [
      { href: '/courses', label: 'Courses' },
      { href: '/pricing', label: 'Pricing' },
    ],
    company: [{ href: '/blog', label: 'Blog' }],
  },
} as const;
