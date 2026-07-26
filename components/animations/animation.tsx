'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState, type ComponentType } from 'react';

/**
 * The single entry point for every interactive diagram.
 *
 * This component exists to make CLAUDE.md #15 structural rather than a rule
 * people have to remember. All three requirements are enforced here, once:
 *
 *   1. `dynamic(..., { ssr: false })` — scene code is a separate chunk, not in
 *      the page bundle, and never runs during prerender.
 *   2. IntersectionObserver mount — a chapter with six diagrams downloads and
 *      executes nothing for the five below the fold.
 *   3. A reserved aspect-ratio box — the slot is the right size from first
 *      paint, so a scene appearing later shifts nothing (CLS).
 *
 * A new animation is a file in ./scenes plus one line in the registry. Authors
 * never touch dynamic imports or observers, which is what stops the rules from
 * quietly eroding one animation at a time.
 *
 * Usage in MDX:
 *   <Animation name="hash-ring" caption="…" />
 */

export type SceneProps = Record<string, never>;

/**
 * Scene registry.
 *
 * The import paths must be static string literals — a computed
 * `import(\`./scenes/${name}\`)` cannot be analysed at build time, so webpack
 * would bundle every scene into one chunk and the lazy loading would be
 * cosmetic.
 */
const SCENES: Record<string, ComponentType<SceneProps>> = {
  'hash-ring': dynamic(() => import('./scenes/hash-ring').then((m) => m.HashRingScene), {
    ssr: false,
    loading: () => <SceneSkeleton />,
  }),
  'array-scan': dynamic(() => import('./scenes/array-scan').then((m) => m.ArrayScanScene), {
    ssr: false,
    loading: () => <SceneSkeleton />,
  }),
  'latency-scale': dynamic(
    () => import('./scenes/latency-scale').then((m) => m.LatencyScaleScene),
    { ssr: false, loading: () => <SceneSkeleton /> },
  ),
};

export type AnimationName = keyof typeof SCENES;

function SceneSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[var(--bg-subtle)]">
      <span className="text-sm text-[var(--fg-muted)]">Loading diagram…</span>
    </div>
  );
}

export function Animation({
  name,
  caption,
  /**
   * Reserved box ratio. Must match what the scene actually draws — this is the
   * number that keeps CLS at zero, so it is a required decision rather than a
   * default that silently works badly.
   */
  ratio = '16 / 10',
}: {
  name: string;
  caption?: string;
  ratio?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldMount, setShouldMount] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    // No IntersectionObserver (very old browsers, some test environments):
    // mount immediately rather than showing a permanent skeleton.
    if (typeof IntersectionObserver === 'undefined') {
      setShouldMount(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldMount(true);
          // One-shot: once mounted, stop observing. Re-mounting on scroll would
          // reset the reader's position in the animation.
          observer.disconnect();
        }
      },
      // Start fetching slightly before it scrolls into view so the chunk has
      // usually arrived by the time the reader gets there.
      { rootMargin: '200px 0px' },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const Scene = SCENES[name];

  if (!Scene) {
    return (
      <figure className="my-8">
        <div
          className="flex items-center justify-center rounded-lg border border-dashed border-red-500/50 bg-red-500/5 p-6 text-sm text-red-500"
          style={{ aspectRatio: ratio }}
        >
          Unknown animation &ldquo;{name}&rdquo;. Registered: {Object.keys(SCENES).join(', ')}.
        </div>
      </figure>
    );
  }

  return (
    <figure className="my-8">
      <div
        ref={containerRef}
        // The reserved box. Height is known before the scene loads, so nothing
        // below it moves when it does.
        style={{ aspectRatio: ratio }}
        className="overflow-hidden rounded-lg border border-[var(--border)]"
      >
        {shouldMount ? <Scene /> : <SceneSkeleton />}
      </div>

      {caption ? (
        <figcaption className="mt-2 text-sm text-pretty text-[var(--fg-muted)]">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
