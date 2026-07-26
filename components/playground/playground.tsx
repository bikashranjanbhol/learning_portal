'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState, type ComponentType } from 'react';

/**
 * MDX entry point for interactive code.
 *
 * Same three rules as `<Animation>` (CLAUDE.md #15), enforced here so authors
 * never restate them: lazy chunk, mount on intersection, reserve the box.
 *
 *   <Playground name="cache-sizing" />
 *
 * A `minHeight` is used rather than an aspect ratio because a control panel is
 * not a fixed-shape drawing — its height depends on the number of parameters,
 * not on the width.
 */

function PlaygroundSkeleton({ minHeight }: { minHeight: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)]"
      style={{ minHeight }}
    >
      <span className="text-sm text-[var(--fg-muted)]">Loading calculator…</span>
    </div>
  );
}

const PLAYGROUNDS: Record<string, ComponentType> = {
  'cache-sizing': dynamic(
    () => import('./calculators/cache-sizing').then((m) => m.CacheSizingPlayground),
    { ssr: false, loading: () => <PlaygroundSkeleton minHeight={420} /> },
  ),
  'shard-sizing': dynamic(
    () => import('./calculators/shard-sizing').then((m) => m.ShardSizingPlayground),
    { ssr: false, loading: () => <PlaygroundSkeleton minHeight={380} /> },
  ),
};

export function Playground({
  name,
  caption,
  minHeight = 420,
}: {
  name: string;
  caption?: string;
  minHeight?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldMount, setShouldMount] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    if (typeof IntersectionObserver === 'undefined') {
      setShouldMount(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldMount(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px 0px' },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const Calculator = PLAYGROUNDS[name];

  if (!Calculator) {
    return (
      <figure className="my-8">
        <div
          className="flex items-center justify-center rounded-lg border border-dashed border-red-500/50 bg-red-500/5 p-6 text-sm text-red-500"
          style={{ minHeight }}
        >
          Unknown playground &ldquo;{name}&rdquo;. Registered:{' '}
          {Object.keys(PLAYGROUNDS).join(', ')}.
        </div>
      </figure>
    );
  }

  return (
    <figure className="my-8">
      <div ref={containerRef} style={{ minHeight }}>
        {shouldMount ? <Calculator /> : <PlaygroundSkeleton minHeight={minHeight} />}
      </div>

      {caption ? (
        <figcaption className="mt-2 text-sm text-pretty text-[var(--fg-muted)]">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
