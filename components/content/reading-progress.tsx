'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Reading progress bar.
 *
 * Positioned fixed, so it never participates in layout and cannot cause a
 * shift. Updates are throttled through requestAnimationFrame and the scroll
 * listener is passive, which keeps it off the main thread's critical path —
 * a naive scroll handler here would be an INP regression on exactly the pages
 * the performance budget is written for.
 */
export function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    function compute() {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      // A page shorter than the viewport is, trivially, fully read.
      setProgress(scrollable <= 0 ? 100 : Math.min(100, (window.scrollY / scrollable) * 100));
      frame.current = null;
    }

    function onScroll() {
      if (frame.current !== null) return;
      frame.current = window.requestAnimationFrame(compute);
    }

    compute();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame.current !== null) window.cancelAnimationFrame(frame.current);
    };
  }, []);

  return (
    <div
      role="progressbar"
      aria-label="Reading progress"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="fixed top-16 right-0 left-0 z-40 h-0.5 bg-transparent"
    >
      <div
        className="h-full bg-[var(--accent)] transition-[width] duration-75 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
