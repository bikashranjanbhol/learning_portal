'use client';

import { SPEEDS, type Playback } from './use-playback';

/**
 * Shared transport controls: step back, play/pause, step forward, reset, speed.
 *
 * Every scene gets these for free. Keyboard accessible, and the step counter is
 * announced politely so a screen-reader user knows the state changed without
 * being interrupted mid-sentence.
 */
export function PlaybackControls({ playback, label }: { playback: Playback; label?: string }) {
  const {
    step,
    stepCount,
    isPlaying,
    speed,
    toggle,
    next,
    previous,
    reset,
    setSpeed,
    isFirst,
    isLast,
  } = playback;

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border)] px-3 py-2">
      <button
        type="button"
        onClick={previous}
        disabled={isFirst}
        aria-label="Previous step"
        className="inline-flex size-8 items-center justify-center rounded-md border border-[var(--border)] text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)] disabled:opacity-40"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="size-4"
          aria-hidden="true"
        >
          <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <button
        type="button"
        onClick={toggle}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        className="inline-flex size-8 items-center justify-center rounded-md bg-[var(--accent)] text-[var(--accent-fg)] transition-opacity hover:opacity-90"
      >
        {isPlaying ? (
          <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5" aria-hidden="true">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5" aria-hidden="true">
            <path d="M8 5l11 7-11 7V5z" />
          </svg>
        )}
      </button>

      <button
        type="button"
        onClick={next}
        disabled={isLast}
        aria-label="Next step"
        className="inline-flex size-8 items-center justify-center rounded-md border border-[var(--border)] text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)] disabled:opacity-40"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="size-4"
          aria-hidden="true"
        >
          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <button
        type="button"
        onClick={reset}
        aria-label="Reset"
        className="inline-flex size-8 items-center justify-center rounded-md border border-[var(--border)] text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)]"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="size-4"
          aria-hidden="true"
        >
          <path d="M3 12a9 9 0 1 0 3-6.7L3 8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 3v5h5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Tabular numerals: the counter must not change width as it counts up,
          or the controls row shifts on every step. */}
      <span
        aria-live="polite"
        className="ml-1 font-mono text-xs text-[var(--fg-muted)] tabular-nums"
      >
        {step + 1} / {stepCount}
        {label ? <span className="ml-2 font-sans">{label}</span> : null}
      </span>

      <div className="ml-auto flex items-center gap-1">
        {SPEEDS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setSpeed(value)}
            aria-pressed={speed === value}
            className={[
              'rounded px-1.5 py-1 font-mono text-xs transition-colors',
              speed === value
                ? 'bg-[var(--bg-subtle)] text-[var(--fg)]'
                : 'text-[var(--fg-muted)] hover:text-[var(--fg)]',
            ].join(' ')}
          >
            {value}×
          </button>
        ))}
      </div>
    </div>
  );
}
