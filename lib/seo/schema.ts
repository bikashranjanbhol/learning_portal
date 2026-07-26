import { site } from '@/lib/site';
import { PREMIUM_CONTENT_SELECTOR } from '@/lib/paywall';
import type {
  BreadcrumbListSchema,
  CourseSchema,
  FaqPageSchema,
  OrganizationSchema,
  PersonSchema,
  SchemaDocument,
  SoftwareSourceCodeSchema,
  TechArticleSchema,
  WebSiteSchema,
} from './schema-types';

/**
 * Typed schema.org builders.
 *
 * CLAUDE.md #13: JSON-LD is never hand-written inline in a page. Everything
 * goes through a builder here so the shapes are checked by the compiler and
 * there is exactly one place to fix when Google changes a requirement.
 */

/** Absolute URL. schema.org requires absolute; relative silently fails validation. */
export function absoluteUrl(pathname: string): string {
  if (pathname.startsWith('http')) return pathname;
  return `${site.url}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
}

// Stable @id values let nodes cross-reference instead of repeating themselves,
// which keeps the emitted JSON small and unambiguous to parsers.
export const ORGANIZATION_ID = `${site.url}/#organization`;
export const PERSON_ID = `${site.url}/#person`;
export const WEBSITE_ID = `${site.url}/#website`;

export function organization(): OrganizationSchema {
  return {
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: site.name,
    url: site.url,
    description: site.description,
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl('/api/og?title=' + encodeURIComponent(site.name)),
      width: 1200,
      height: 630,
    },
    founder: { '@id': PERSON_ID },
  };
}

export function person(): PersonSchema {
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: site.author.name,
    url: site.url,
    jobTitle: 'Software engineer',
    description: `Author of ${site.name}.`,
  };
}

export function website(): WebSiteSchema {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: site.name,
    url: site.url,
    description: site.description,
    publisher: { '@id': ORGANIZATION_ID },
    inLanguage: 'en',
  };
}

/**
 * TechArticle for a chapter or blog post.
 *
 * `isAccessibleForFree` is required, not optional, so it is impossible to emit
 * an article without deciding. CLAUDE.md #7: free chapters must emit true —
 * blanket-applying the paywall flag misrepresents free content and costs
 * indexing on exactly the pages meant to attract readers.
 *
 * When it is false, the nested hasPart is added automatically using the shared
 * selector constant. Callers cannot supply their own and get it wrong.
 */
export function techArticle(input: {
  headline: string;
  description: string;
  pathname: string;
  datePublished: string;
  dateModified?: string;
  isAccessibleForFree: boolean;
  section?: string;
  keywords?: string[];
  readingTimeMinutes?: number;
  proficiencyLevel?: 'Beginner' | 'Intermediate' | 'Expert';
  ogImage?: string;
}): TechArticleSchema {
  const url = absoluteUrl(input.pathname);

  const schema: TechArticleSchema = {
    '@type': 'TechArticle',
    '@id': `${url}#article`,
    headline: input.headline,
    description: input.description,
    url,
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    author: { '@id': PERSON_ID },
    publisher: { '@id': ORGANIZATION_ID },
    isAccessibleForFree: input.isAccessibleForFree,
    inLanguage: 'en',
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };

  if (!input.isAccessibleForFree) {
    // The paywall declaration. Selector comes from lib/paywall.ts so it cannot
    // drift from the className the Gate renders.
    schema.hasPart = {
      '@type': 'WebPageElement',
      isAccessibleForFree: false,
      cssSelector: PREMIUM_CONTENT_SELECTOR,
    };
  }

  if (input.ogImage) schema.image = input.ogImage;
  if (input.section) schema.articleSection = input.section;
  if (input.keywords?.length) schema.keywords = input.keywords.join(', ');
  if (input.proficiencyLevel) schema.proficiencyLevel = input.proficiencyLevel;
  if (input.readingTimeMinutes) schema.timeRequired = `PT${input.readingTimeMinutes}M`;

  return schema;
}

/**
 * Course, with the CourseInstance array Google has required for the Course rich
 * result since 2024 — a Course without one is ignored rather than rejected,
 * which is why it is not optional here.
 */
export function course(input: {
  name: string;
  description: string;
  pathname: string;
  chapterCount: number;
  totalMinutes: number;
  isFree: boolean;
  teaches?: string[];
}): CourseSchema {
  const url = absoluteUrl(input.pathname);

  return {
    '@type': 'Course',
    '@id': `${url}#course`,
    name: input.name,
    description: input.description,
    url,
    provider: { '@id': ORGANIZATION_ID },
    hasCourseInstance: [
      {
        '@type': 'CourseInstance',
        courseMode: 'online',
        // ISO 8601 duration. Google reads this for the "time to complete" line.
        courseWorkload: `PT${input.totalMinutes}M`,
        instructor: { '@id': PERSON_ID },
      },
    ],
    inLanguage: 'en',
    numberOfCredits: input.chapterCount,
    isAccessibleForFree: input.isFree,
    ...(input.teaches?.length ? { teaches: input.teaches } : {}),
  };
}

export function faqPage(
  questions: Array<{ question: string; answer: string }>,
  pathname: string,
): FaqPageSchema {
  return {
    '@type': 'FAQPage',
    '@id': `${absoluteUrl(pathname)}#faq`,
    mainEntity: questions.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: { '@type': 'Answer', text: entry.answer },
    })),
  };
}

/**
 * BreadcrumbList (CLAUDE.md #10 — required on every nested route).
 *
 * The final crumb deliberately omits `item`: per Google's spec the current page
 * should not link to itself.
 */
export function breadcrumbs(
  trail: Array<{ name: string; pathname?: string }>,
): BreadcrumbListSchema {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      ...(crumb.pathname && index < trail.length - 1
        ? { item: absoluteUrl(crumb.pathname) }
        : {}),
    })),
  };
}

export function softwareSourceCode(input: {
  name: string;
  description?: string;
  language: string;
  code?: string;
  pathname?: string;
}): SoftwareSourceCodeSchema {
  return {
    '@type': 'SoftwareSourceCode',
    name: input.name,
    programmingLanguage: input.language,
    codeSampleType: 'code snippet',
    ...(input.description ? { description: input.description } : {}),
    ...(input.code ? { text: input.code } : {}),
    ...(input.pathname ? { url: absoluteUrl(input.pathname) } : {}),
  };
}

/**
 * Combine nodes into a single @graph document.
 *
 * One <script> per page rather than several: parsers handle both, but a graph
 * lets nodes reference each other by @id instead of duplicating the publisher
 * and author objects into every article.
 */
export function graph(...nodes: Array<SchemaDocument extends never ? never : object>) {
  return {
    '@context': 'https://schema.org',
    '@graph': nodes,
  } as const;
}
