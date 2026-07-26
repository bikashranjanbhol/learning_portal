'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/lib/hooks/use-user';

/**
 * Signed-in / signed-out header slot.
 *
 * A client component on purpose: the pages that render it are statically
 * generated, so the shell is identical for every visitor and this fills in
 * afterwards. Reading the session on the server here would opt / and every
 * content route into dynamic rendering.
 *
 * The outer element has a fixed width in every state so the header does not
 * reflow when auth resolves — otherwise this is a CLS regression on the
 * highest-traffic pages on the site.
 */
export function AuthNav() {
  const { user, loading } = useUser();
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();

  async function signOut() {
    setSigningOut(true);
    await createClient().auth.signOut();
    router.push('/');
    router.refresh();
  }

  if (loading) {
    return <div className="h-9 w-32" aria-hidden="true" />;
  }

  if (!user) {
    return (
      <div className="flex h-9 w-32 items-center justify-end gap-2">
        <Link
          href="/sign-in"
          className="rounded-md px-3 py-2 text-sm font-medium text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)]"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-9 w-32 items-center justify-end gap-2">
      <Link
        href="/dashboard"
        className="rounded-md px-3 py-2 text-sm font-medium text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)]"
      >
        Dashboard
      </Link>
      <button
        type="button"
        onClick={signOut}
        disabled={signingOut}
        className="rounded-md px-2 py-2 text-sm text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)] disabled:opacity-50"
      >
        {signingOut ? '…' : 'Out'}
      </button>
    </div>
  );
}
