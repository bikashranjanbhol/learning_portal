'use client';

import { useEffect } from 'react';

/**
 * Route-level error boundary. Sprint 0 logs to the console; the pre-launch
 * checklist (plan §11.8) replaces this with Sentry.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-3 text-sm text-[var(--fg-muted)]">
        The error has been logged. Trying again often works.
      </p>
      {error.digest ? (
        <p className="mt-4 font-mono text-xs text-[var(--fg-muted)]">
          Reference: {error.digest}
        </p>
      ) : null}
      <button
        type="button"
        onClick={reset}
        className="mt-8 self-center rounded-lg bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--accent-fg)]"
      >
        Try again
      </button>
    </div>
  );
}
