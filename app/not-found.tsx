import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 text-center">
      <p className="font-mono text-sm text-[var(--fg-muted)]">404</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">We couldn&apos;t find that</h1>
      <p className="mt-3 text-sm text-[var(--fg-muted)]">
        The page may have moved. The course index is the fastest way back.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link
          href="/"
          className="rounded-lg bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--accent-fg)]"
        >
          Home
        </Link>
        <Link
          href="/courses"
          className="rounded-lg border border-[var(--border)] px-5 py-3 text-sm font-semibold"
        >
          Courses
        </Link>
      </div>
    </div>
  );
}
