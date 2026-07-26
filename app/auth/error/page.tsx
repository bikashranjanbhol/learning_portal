import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sign-in problem',
  robots: { index: false, follow: false },
};

// Reads searchParams, so this route is dynamic. That is fine and intended —
// it is a noindex auth page, not content.
export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">That link didn&apos;t work</h1>
      <p className="mt-3 text-sm text-[var(--fg-muted)]">
        Sign-in links are single-use and expire after an hour. Requesting a new one usually
        fixes it.
      </p>
      {reason ? (
        <p className="mt-4 rounded-md border border-[var(--border)] bg-[var(--bg-subtle)] p-3 font-mono text-xs break-words text-[var(--fg-muted)]">
          {reason}
        </p>
      ) : null}
      <Link
        href="/sign-in"
        className="mt-8 rounded-lg bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--accent-fg)]"
      >
        Back to sign in
      </Link>
    </div>
  );
}
