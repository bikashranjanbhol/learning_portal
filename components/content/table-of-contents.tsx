'use client';

import { useEffect, useState } from 'react';
import type { TocEntry } from '@/lib/content/types';

/**
 * Table of contents with scroll-spy.
 *
 * The list itself is rendered from data passed by the server, so the links are
 * in the initial HTML and work without JavaScript. Only the active-section
 * highlight needs the client.
 *
 * IntersectionObserver rather than a scroll listener: a scroll handler fires on
 * every frame and is a well-known way to lose the INP budget on long pages.
 */
export function TableOfContents({ entries }: { entries: TocEntry[] }) {
  const [activeId, setActiveId] = useState<string | null>(entries[0]?.id ?? null);

  useEffect(() => {
    if (entries.length === 0) return;

    const headings = entries
      .map((entry) => document.getElementById(entry.id))
      .filter((el): el is HTMLElement => el !== null);

    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (observed) => {
        // Track every heading currently in the band, then take the topmost.
        // Reacting to individual entries makes the highlight jump around when
        // several headings cross the boundary in one scroll.
        const visible = observed
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]) setActiveId(visible[0].target.id);
      },
      {
        // Band across the upper third: a heading counts as "current" once it
        // reaches reading position, not when it first touches the viewport.
        rootMargin: '-80px 0px -66% 0px',
        threshold: 0,
      },
    );

    for (const heading of headings) observer.observe(heading);
    return () => observer.disconnect();
  }, [entries]);

  if (entries.length === 0) return null;

  return (
    <nav aria-label="On this page" className="text-sm">
      <p className="mb-3 font-semibold">On this page</p>
      <ul className="space-y-1 border-l border-[var(--border)]">
        {entries.map((entry) => {
          const isActive = entry.id === activeId;
          return (
            <li key={entry.id}>
              <a
                href={`#${entry.id}`}
                aria-current={isActive ? 'location' : undefined}
                className={[
                  'block border-l-2 py-1 transition-colors',
                  entry.depth === 3 ? 'pl-7' : 'pl-4',
                  isActive
                    ? 'border-[var(--accent)] text-[var(--fg)]'
                    : 'border-transparent text-[var(--fg-muted)] hover:text-[var(--fg)]',
                ].join(' ')}
              >
                {entry.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
