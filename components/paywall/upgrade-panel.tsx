'use client';

import Link from 'next/link';
import { useUser } from '@/lib/hooks/use-user';

/**
 * What a reader sees where the gated content would be.
 *
 * Rendered immediately below the faded-out premium region, so the visual story
 * is "the chapter continues, and here is how to keep reading" rather than a
 * dead end.
 *
 * Fixed minimum height: this appears and disappears as entitlement resolves,
 * and a variable-height panel at that moment is a layout shift on every page
 * load for signed-in subscribers.
 */
export function UpgradePanel({ loading }: { loading: boolean }) {
  const { user } = useUser();

  return (
    <aside
      className="relative z-10 -mt-20 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6 shadow-lg sm:p-8"
      style={{ minHeight: 260 }}
    >
      {loading ? (
        // Placeholder of the same shape, so nothing jumps when it resolves.
        <div className="animate-pulse space-y-3" aria-hidden="true">
          <div className="h-5 w-2/3 rounded bg-[var(--bg-subtle)]" />
          <div className="h-4 w-full rounded bg-[var(--bg-subtle)]" />
          <div className="h-4 w-5/6 rounded bg-[var(--bg-subtle)]" />
          <div className="mt-6 h-11 w-40 rounded-lg bg-[var(--bg-subtle)]" />
        </div>
      ) : (
        <>
          <h2 className="text-xl font-semibold tracking-tight">
            Keep reading the rest of this chapter
          </h2>
          <p className="mt-3 max-w-xl text-pretty text-[var(--fg-muted)]">
            You have read the free preview. The rest of this chapter — and every chapter in every
            course — is included in one payment. Nothing renews automatically and there is no card
            kept on file.
          </p>

          <ul className="mt-5 grid gap-2 text-sm text-[var(--fg-muted)] sm:grid-cols-2">
            {[
              'Every chapter, unlocked',
              'All interactive diagrams',
              'One-time payment, no renewal',
              'Regional pricing applied automatically',
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden="true" className="text-[var(--accent)]">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/pricing"
              className="rounded-lg bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--accent-fg)] transition-opacity hover:opacity-90"
            >
              See pricing
            </Link>

            {user ? null : (
              <Link
                href="/sign-in"
                className="rounded-lg border border-[var(--border)] px-5 py-3 text-sm font-semibold transition-colors hover:bg-[var(--bg-subtle)]"
              >
                Already bought? Sign in
              </Link>
            )}
          </div>

          <p className="mt-5 text-xs text-[var(--fg-muted)]">
            Around a third of every course is free to read without an account.{' '}
            <Link href="/courses" className="underline underline-offset-2">
              Browse the free chapters
            </Link>
            .
          </p>
        </>
      )}
    </aside>
  );
}
