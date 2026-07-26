import Link from 'next/link';
import type { ChapterRef } from '@/lib/content/types';

/**
 * Chapter list for a course.
 *
 * Server component. The current chapter is passed in as a prop rather than read
 * from usePathname so this ships no JavaScript — the page is statically
 * generated per chapter anyway, so the active item is known at build time.
 */
export function CourseSidebar({
  courseSlug,
  courseTitle,
  chapters,
  currentSlug,
}: {
  courseSlug: string;
  courseTitle: string;
  chapters: ChapterRef[];
  currentSlug: string;
}) {
  return (
    <nav aria-label={`${courseTitle} chapters`} className="text-sm">
      <Link
        href="/courses"
        className="text-xs text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)]"
      >
        ← All courses
      </Link>
      <p className="mt-3 mb-4 font-semibold">{courseTitle}</p>

      <ol className="space-y-0.5">
        {chapters.map((chapter, index) => {
          const isCurrent = chapter.slug === currentSlug;
          return (
            <li key={chapter.slug}>
              <Link
                href={`/learn/${courseSlug}/${chapter.slug}`}
                aria-current={isCurrent ? 'page' : undefined}
                className={[
                  'flex gap-3 rounded-md px-3 py-2 transition-colors',
                  isCurrent
                    ? 'bg-[var(--bg-subtle)] font-medium text-[var(--fg)]'
                    : 'text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)]',
                ].join(' ')}
              >
                <span className="font-mono text-xs tabular-nums opacity-60">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="flex-1">
                  {chapter.title}
                  {chapter.isFree ? (
                    <span className="ml-2 rounded border border-emerald-500/40 px-1 py-px text-[10px] tracking-wide text-emerald-600 uppercase dark:text-emerald-400">
                      Free
                    </span>
                  ) : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
