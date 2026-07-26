import type { Metadata } from 'next';
import Link from 'next/link';
import { getCourses } from '@/lib/content';
import { buildMetadata } from '@/lib/seo/metadata';

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  title: 'Courses',
  description:
    'Courses on system design, low-level design, and data structures and algorithms — interactive chapters with worked examples and the reasoning behind each trade-off.',
  pathname: '/courses',
  eyebrow: 'Courses',
});

export default async function CoursesPage() {
  const courses = await getCourses();

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Courses</h1>
      <p className="mt-4 max-w-2xl text-lg text-pretty text-[var(--fg-muted)]">
        Each course builds from the problem a technique exists to solve, rather than presenting
        it as a fact to memorise. Around a third of every course is free to read.
      </p>

      {courses.length === 0 ? (
        <p className="mt-12 rounded-xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--fg-muted)]">
          No courses yet. Add a folder under <code>content/courses/</code> with a{' '}
          <code>course.json</code> and one or more <code>.mdx</code> chapters.
        </p>
      ) : (
        <ul className="mt-12 space-y-6">
          {courses.map((course) => {
            const { slug, title, description, eyebrow } = course.frontmatter;
            const freeCount = course.chapters.filter((c) => c.frontmatter.isFree).length;
            const firstChapter = course.chapters[0];

            return (
              <li key={slug}>
                <article className="rounded-xl border border-[var(--border)] p-6 transition-colors hover:bg-[var(--bg-subtle)]">
                  {eyebrow ? (
                    <p className="text-xs tracking-wide text-[var(--fg-muted)] uppercase">
                      {eyebrow}
                    </p>
                  ) : null}

                  <h2 className="mt-1 text-xl font-semibold tracking-tight">
                    <Link href={`/courses/${slug}`}>{title}</Link>
                  </h2>

                  <p className="mt-2 max-w-2xl text-pretty text-[var(--fg-muted)]">
                    {description}
                  </p>

                  <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--fg-muted)]">
                    <span>
                      {course.chapters.length} chapter
                      {course.chapters.length === 1 ? '' : 's'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{freeCount} free</span>
                  </p>

                  {firstChapter ? (
                    <Link
                      href={`/learn/${slug}/${firstChapter.frontmatter.slug}`}
                      className="mt-5 inline-block rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-fg)] transition-opacity hover:opacity-90"
                    >
                      Start reading
                    </Link>
                  ) : null}
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
