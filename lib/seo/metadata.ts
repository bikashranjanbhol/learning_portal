import type { Metadata } from 'next';
import { site } from '@/lib/site';
import { absoluteUrl } from './schema';

/**
 * Shared metadata construction (CLAUDE.md #9: every route needs title,
 * description, canonical, OG and Twitter).
 *
 * Centralised so adding a field later is one edit rather than fifteen, and so
 * no route can quietly ship without a canonical.
 */

export function ogImageUrl(input: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
}): string {
  const params = new URLSearchParams({ title: input.title });
  if (input.subtitle) params.set('subtitle', input.subtitle);
  if (input.eyebrow) params.set('eyebrow', input.eyebrow);
  return absoluteUrl(`/api/og?${params.toString()}`);
}

export function buildMetadata(input: {
  title: string;
  description: string;
  pathname: string;
  /** Present for articles, omitted for index and marketing pages. */
  publishedAt?: string;
  updatedAt?: string;
  keywords?: string[];
  eyebrow?: string;
  /** Auth pages and anything user-scoped. */
  noindex?: boolean;
}): Metadata {
  const image = ogImageUrl({
    title: input.title,
    subtitle: input.description,
    eyebrow: input.eyebrow,
  });

  const isArticle = Boolean(input.publishedAt);

  return {
    title: input.title,
    description: input.description,
    ...(input.keywords?.length ? { keywords: input.keywords } : {}),

    // Relative is correct here — metadataBase in the root layout makes it
    // absolute. Hard-coding the origin breaks preview deployments, which then
    // emit canonicals pointing at production.
    alternates: { canonical: input.pathname },

    ...(input.noindex ? { robots: { index: false, follow: false } } : {}),

    openGraph: {
      type: isArticle ? 'article' : 'website',
      title: input.title,
      description: input.description,
      url: input.pathname,
      siteName: site.name,
      locale: 'en_US',
      images: [{ url: image, width: 1200, height: 630, alt: input.title }],
      ...(isArticle
        ? {
            publishedTime: input.publishedAt,
            modifiedTime: input.updatedAt ?? input.publishedAt,
            authors: [site.author.name],
          }
        : {}),
    },

    twitter: {
      card: 'summary_large_image',
      title: input.title,
      description: input.description,
      images: [image],
    },
  };
}
