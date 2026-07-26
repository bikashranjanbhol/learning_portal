import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { site } from '@/lib/site';
import { buildMetadata } from '@/lib/seo/metadata';
import { SignInForm } from '@/components/auth/sign-in-form';

// noindex, but still gets a full metadata treatment: sign-in links get pasted
// into chat and email, and an unfurl with no image and a six-word description
// looks broken. Being excluded from search is not a reason to skip the card.
export const metadata: Metadata = buildMetadata({
  title: 'Sign in',
  description: `Sign in to ${site.name} to track your progress, save highlights, and pick up where you left off. Google, GitHub, or a link sent to your email.`,
  pathname: '/sign-in',
  eyebrow: site.name,
  noindex: true,
});

/**
 * Static shell.
 *
 * The `?next=` parameter is read in a client component rather than from
 * `searchParams` here — reading searchParams in this page would opt it into
 * dynamic rendering (CLAUDE.md #2). It costs nothing to keep it static.
 */
export default function SignInPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-16">
      <div className="mb-8 text-center">
        <Link href="/" className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg)]">
          ← {site.name}
        </Link>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-[var(--fg-muted)]">
          New here? Signing in creates your account.
        </p>
      </div>

      <Suspense fallback={<div className="h-72" />}>
        <SignInForm />
      </Suspense>

      <p className="mt-8 text-center text-xs text-[var(--fg-muted)]">
        By continuing you agree to our{' '}
        <Link href="/terms" className="underline underline-offset-2">
          Terms
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="underline underline-offset-2">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
