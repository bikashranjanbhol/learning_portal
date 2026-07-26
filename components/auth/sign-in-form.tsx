'use client';

import { useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { safeRedirect } from '@/lib/routes';
import { GoogleIcon, GitHubIcon } from './provider-icons';

type Status =
  | { kind: 'idle' }
  | { kind: 'working'; provider: 'google' | 'github' | 'email' }
  | { kind: 'sent'; email: string }
  | { kind: 'error'; message: string };

export function SignInForm() {
  const searchParams = useSearchParams();
  const next = safeRedirect(searchParams.get('next'));

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const busy = status.kind === 'working';

  async function signInWithOAuth(provider: 'google' | 'github') {
    setStatus({ kind: 'working', provider });
    const supabase = createClient();

    // window.location.origin rather than an env var: this keeps preview
    // deployments working without adding every preview URL to config.
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });

    if (error) setStatus({ kind: 'error', message: error.message });
    // On success the browser navigates away; no state update needed.
  }

  async function signInWithMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setStatus({ kind: 'working', provider: 'email' });
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`,
        shouldCreateUser: true,
      },
    });

    if (error) {
      setStatus({ kind: 'error', message: error.message });
      return;
    }
    setStatus({ kind: 'sent', email: trimmed });
  }

  if (status.kind === 'sent') {
    return (
      <div className="rounded-xl border border-[var(--border)] p-6 text-center">
        <h2 className="font-semibold">Check your email</h2>
        <p className="mt-2 text-sm text-[var(--fg-muted)]">
          We sent a sign-in link to <span className="text-[var(--fg)]">{status.email}</span>.
          The link expires in an hour.
        </p>
        <button
          type="button"
          onClick={() => setStatus({ kind: 'idle' })}
          className="mt-4 text-sm underline underline-offset-2"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => signInWithOAuth('google')}
        disabled={busy}
        className="flex h-11 items-center justify-center gap-3 rounded-lg border border-[var(--border)] px-4 text-sm font-medium transition-colors hover:bg-[var(--bg-subtle)] disabled:opacity-60"
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <button
        type="button"
        onClick={() => signInWithOAuth('github')}
        disabled={busy}
        className="flex h-11 items-center justify-center gap-3 rounded-lg border border-[var(--border)] px-4 text-sm font-medium transition-colors hover:bg-[var(--bg-subtle)] disabled:opacity-60"
      >
        <GitHubIcon />
        Continue with GitHub
      </button>

      <div className="flex items-center gap-3 py-1">
        <span className="h-px flex-1 bg-[var(--border)]" />
        <span className="text-xs text-[var(--fg-muted)]">or</span>
        <span className="h-px flex-1 bg-[var(--border)]" />
      </div>

      <form onSubmit={signInWithMagicLink} className="flex flex-col gap-3">
        <label htmlFor="email" className="sr-only">
          Email address
        </label>
        <input
          id="email"
          type="email"
          name="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={busy}
          className="h-11 rounded-lg border border-[var(--border)] bg-transparent px-4 text-sm outline-none placeholder:text-[var(--fg-muted)] focus-visible:border-[var(--accent)] disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={busy}
          className="h-11 rounded-lg bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-fg)] transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {status.kind === 'working' && status.provider === 'email'
            ? 'Sending…'
            : 'Email me a sign-in link'}
        </button>
      </form>

      {/* Reserved height so an error appearing does not shift the form. */}
      <p role="status" aria-live="polite" className="min-h-5 text-sm text-red-500">
        {status.kind === 'error' ? status.message : ''}
      </p>
    </div>
  );
}
