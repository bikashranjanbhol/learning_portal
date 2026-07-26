import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  formatDate,
  getAllChapterParams,
  getChapter,
  getChapterNeighbours,
  getCourse,
  splitAtPaywall,
  toChapterRefs,
} from '@/lib/content';
import { Mdx } from '@/lib/content/mdx';
import { CourseSidebar } from '@/components/content/course-sidebar';
import { TableOfContents } from '@/components/content/table-of-contents';
import { ChapterNav } from '@/components/content/chapter-nav';
import { ReadingProgress } from '@/components/content/reading-progress';
import { Breadcrumbs } from '@/components/seo/breadcrumbs';
import { JsonLd } from '@/components/seo/json-ld';
import { buildMetadata, ogImageUrl } from '@/lib/seo/metadata';
import { graph, techArticle } from '@/lib/seo/schema';
import { PAYWALL_ACTIVE, PAYWALL_STRATEGY, isAccessibleForFree } from '@/lib/paywall';
import { Gate } from '@/components/paywall/gate';

/**
 * Chapter page — SSG + ISR 3600 (CLAUDE.md §3 route map).
 *
 * Every chapter is prerendered at build time and revalidated hourly, so the
 * full text is in the initial HTML for crawlers and the page is served from the
 * CDN for readers. Sprint 3 adds the paywall; for now everything renders free.
 */
export const revalidate = 3600;

/** Only known chapters exist — an unknown slug 404s rather than rendering on demand. */
export const dynamicParams = false;

type Params = { course: string; chapter: string };

export async function generateStaticParams(): Promise<Params[]> {
  return getAllChapterParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { course: courseSlug, chapter: chapterSlug } = await params;
  const [course, chapter] = await Promise.all([
    getCourse(courseSlug),
    getChapter(courseSlug, chapterSlug),
  ]);
  if (!chapter) return {};

  const { title, description, publishedAt, updatedAt } = chapter.frontmatter;

  return buildMetadata({
    title,
    description,
    pathname: `/learn/${courseSlug}/${chapterSlug}`,
    publishedAt,
    updatedAt,
    eyebrow: course?.frontmatter.title,
  });
}

export default async function ChapterPage({ params }: { params: Promise<Params> }) {
  const { course: courseSlug, chapter: chapterSlug } = await params;

  const course = await getCourse(courseSlug);
  const chapter = await getChapter(courseSlug, chapterSlug);
  if (!course || !chapter) notFound();

  const neighbours = getChapterNeighbours(course, chapterSlug);
  const { title, description, publishedAt, updatedAt, isFree } = chapter.frontmatter;
  const pathname = `/learn/${courseSlug}/${chapterSlug}`;

  // A chapter is gated only when the paywall is on AND the chapter is not free.
  const gated = PAYWALL_ACTIVE && !isFree;

  const split = splitAtPaywall(chapter.body);
  const preview = split.preview;
  // Under the 'truncated' strategy the gated half is never sent to anyone —
  // not to readers, not to crawlers. Under 'declared' it is sent to everyone
  // and hidden in the UI. What is never done is sending it to one and not the
  // other based on who is asking.
  const premium = PAYWALL_STRATEGY === 'truncated' ? '' : split.premium;

  // CLAUDE.md #7: free chapters emit isAccessibleForFree: true, never a blanket
  // paywall flag. isAccessibleForFree() also accounts for PAYWALL_ACTIVE being
  // false until Sprint 3 — while nothing is gated, every chapter really is free
  // and the markup must say so. The builder attaches the hasPart
  // WebPageElement only when this is false, using the shared selector.
  const articleSchema = techArticle({
    headline: title,
    description,
    pathname,
    datePublished: publishedAt,
    dateModified: updatedAt,
    isAccessibleForFree: isAccessibleForFree(isFree),
    section: course.frontmatter.title,
    readingTimeMinutes: chapter.readingTime,
    ogImage: ogImageUrl({
      title,
      subtitle: description,
      eyebrow: course.frontmatter.title,
    }),
  });

  return (
    <>
      <JsonLd data={graph(articleSchema)} />
      <ReadingProgress />

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_220px]">
        {/* Sticky on large screens, inline above the article on small ones. */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <CourseSidebar
            courseSlug={courseSlug}
            courseTitle={course.frontmatter.title}
            chapters={toChapterRefs(course)}
            currentSlug={chapterSlug}
          />
        </aside>

        <article className="min-w-0">
          <Breadcrumbs
            trail={[
              { name: 'Courses', pathname: '/courses' },
              { name: course.frontmatter.title, pathname: `/courses/${courseSlug}` },
              { name: title, pathname },
            ]}
          />

          <header className="mt-4 border-b border-[var(--border)] pb-8">
            <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              {title}
            </h1>
            <p className="mt-4 text-lg text-pretty text-[var(--fg-muted)]">{description}</p>

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--fg-muted)]">
              <span>{chapter.readingTime} min read</span>
              <span aria-hidden="true">·</span>
              <time dateTime={updatedAt ?? publishedAt}>
                Updated {formatDate(updatedAt ?? publishedAt)}
              </time>
              {isFree ? (
                <span className="rounded border border-emerald-500/40 px-1.5 py-px text-[11px] tracking-wide text-emerald-600 uppercase dark:text-emerald-400">
                  Free
                </span>
              ) : null}
            </div>
          </header>

          {/* Contents inline on narrow screens, where the right rail is hidden. */}
          <div className="mt-8 rounded-xl border border-[var(--border)] p-5 xl:hidden">
            <TableOfContents entries={chapter.toc} />
          </div>

          {/*
            Free chapters render whole. Gated chapters render the preview in the
            open, then everything after the split inside <Gate>, whose wrapper
            class comes from the same constant as the JSON-LD cssSelector
            (CLAUDE.md #5).

            Note what is absent: any reference to the user agent. The served
            HTML is identical for a crawler and a logged-out human, and the
            structured data is what explains the difference between what is
            indexed and what is shown (CLAUDE.md #6). Under the 'truncated'
            strategy the premium half is never rendered at all, so the same
            statement stays true.
          */}
          <div className="mt-2">
            {gated ? (
              <>
                <Mdx source={preview} />
                {premium ? (
                  <Gate>
                    <Mdx source={premium} />
                  </Gate>
                ) : null}
              </>
            ) : (
              <Mdx source={chapter.body} />
            )}
          </div>

          <ChapterNav courseSlug={courseSlug} neighbours={neighbours} />
        </article>

        <aside className="hidden xl:sticky xl:top-24 xl:block xl:self-start">
          <TableOfContents entries={chapter.toc} />
        </aside>
      </div>
    </>
  );
}
