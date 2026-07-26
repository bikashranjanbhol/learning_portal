import Link from 'next/link';
import type { ChapterNeighbours } from '@/lib/content';

export function ChapterNav({
  courseSlug,
  neighbours,
}: {
  courseSlug: string;
  neighbours: ChapterNeighbours;
}) {
  const { previous, next } = neighbours;
  if (!previous && !next) return null;

  return (
    <nav
      aria-label="Chapter navigation"
      className="mt-16 grid gap-4 border-t border-[var(--border)] pt-8 sm:grid-cols-2"
    >
      {previous ? (
        <Link
          href={`/learn/${courseSlug}/${previous.slug}`}
          rel="prev"
          className="rounded-xl border border-[var(--border)] p-4 transition-colors hover:bg-[var(--bg-subtle)]"
        >
          <span className="text-xs text-[var(--fg-muted)]">← Previous</span>
          <span className="mt-1 block font-medium">{previous.title}</span>
        </Link>
      ) : (
        // Keeps "Next" in the right column when there is no previous chapter.
        <span aria-hidden="true" />
      )}

      {next ? (
        <Link
          href={`/learn/${courseSlug}/${next.slug}`}
          rel="next"
          className="rounded-xl border border-[var(--border)] p-4 text-right transition-colors hover:bg-[var(--bg-subtle)]"
        >
          <span className="text-xs text-[var(--fg-muted)]">Next →</span>
          <span className="mt-1 block font-medium">{next.title}</span>
        </Link>
      ) : null}
    </nav>
  );
}
