import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCourse, getCourses } from '@/lib/content';
import { Breadcrumbs } from '@/components/seo/breadcrumbs';
import { JsonLd } from '@/components/seo/json-ld';
import { buildMetadata } from '@/lib/seo/metadata';
import { course as courseSchema, graph } from '@/lib/seo/schema';

export const revalidate = 3600;
export const dynamicParams = false;

type Params = { course: string };

export async function generateStaticParams(): Promise<Params[]> {
  const courses = await getCourses();
  return courses.map((course) => ({ course: course.frontmatter.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { course: slug } = await params;
  const course = await getCourse(slug);
  if (!course) return {};

  const { title, description, eyebrow } = course.frontmatter;
  return buildMetadata({
    title,
    description,
    pathname: `/courses/${slug}`,
    eyebrow: eyebrow ?? 'Course',
  });
}

export default async function CourseOverviewPage({ params }: { params: Promise<Params> }) {
  const { course: slug } = await params;
  const course = await getCourse(slug);
  if (!course) notFound();

  const { title, description, eyebrow } = course.frontmatter;
  const totalMinutes = course.chapters.reduce((sum, c) => sum + c.readingTime, 0);
  const firstChapter = course.chapters[0];
  const hasFreeChapters = course.chapters.some((c) => c.frontmatter.isFree);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <JsonLd
        data={graph(
          courseSchema({
            name: title,
            description,
            pathname: `/courses/${slug}`,
            chapterCount: course.chapters.length,
            totalMinutes,
            // Partially free: the course has free chapters even though the
            // course as a whole is premium. Google reads this as "has a free
            // component", which is accurate and what drives the free-trial
            // annotation in the Course rich result.
            isFree: hasFreeChapters,
            teaches: course.chapters.map((c) => c.frontmatter.title),
          }),
        )}
      />

      <Breadcrumbs
        trail={[
          { name: 'Courses', pathname: '/courses' },
          { name: title, pathname: `/courses/${slug}` },
        ]}
      />

      {eyebrow ? (
        <p className="mt-6 text-xs tracking-wide text-[var(--fg-muted)] uppercase">{eyebrow}</p>
      ) : null}

      <h1 className="mt-1 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        {title}
      </h1>
      <p className="mt-4 text-lg text-pretty text-[var(--fg-muted)]">{description}</p>

      <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--fg-muted)]">
        <span>
          {course.chapters.length} chapter{course.chapters.length === 1 ? '' : 's'}
        </span>
        <span aria-hidden="true">·</span>
        <span>~{totalMinutes} min total</span>
      </p>

      {firstChapter ? (
        <Link
          href={`/learn/${slug}/${firstChapter.frontmatter.slug}`}
          className="mt-8 inline-block rounded-lg bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--accent-fg)] transition-opacity hover:opacity-90"
        >
          Start with chapter 1
        </Link>
      ) : null}

      <h2 className="mt-14 text-xl font-semibold tracking-tight">Chapters</h2>
      <ol className="mt-6 space-y-1">
        {course.chapters.map((chapter, index) => (
          <li key={chapter.frontmatter.slug}>
            <Link
              href={`/learn/${slug}/${chapter.frontmatter.slug}`}
              className="flex gap-4 rounded-lg border border-transparent p-4 transition-colors hover:border-[var(--border)] hover:bg-[var(--bg-subtle)]"
            >
              <span className="pt-0.5 font-mono text-sm text-[var(--fg-muted)] tabular-nums">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="flex-1">
                <span className="block font-medium">
                  {chapter.frontmatter.title}
                  {chapter.frontmatter.isFree ? (
                    <span className="ml-2 rounded border border-emerald-500/40 px-1.5 py-px align-middle text-[10px] tracking-wide text-emerald-600 uppercase dark:text-emerald-400">
                      Free
                    </span>
                  ) : null}
                </span>
                <span className="mt-1 block text-sm text-pretty text-[var(--fg-muted)]">
                  {chapter.frontmatter.description}
                </span>
                <span className="mt-2 block text-xs text-[var(--fg-muted)]">
                  {chapter.readingTime} min
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
