import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { SignOutButton } from '@/components/auth/sign-out-button';

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Every query below runs as the signed-in user, so RLS — not this code —
  // is what guarantees another user's rows are unreachable. Verify with
  // `npm run verify:rls`.
  const [{ data: profile }, { data: subscriptions }] = await Promise.all([
    supabase.from('users').select('*').eq('id', user!.id).maybeSingle(),
    supabase.from('subscriptions').select('*').order('created_at', { ascending: false }),
  ]);

  const activeAccess = (subscriptions ?? []).some(
    (row) =>
      row.status === 'active' &&
      (row.expires_at === null || new Date(row.expires_at) > new Date()),
  );

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {profile?.name ? `Hello, ${profile.name.split(' ')[0]}` : 'Dashboard'}
          </h1>
          <p className="mt-1 text-sm text-[var(--fg-muted)]">{profile?.email ?? user?.email}</p>
        </div>
        <SignOutButton />
      </div>

      <dl className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] p-5">
          <dt className="text-sm text-[var(--fg-muted)]">Access</dt>
          <dd className="mt-1 text-lg font-semibold">
            {activeAccess ? 'Premium' : 'Free tier'}
          </dd>
        </div>
        <div className="rounded-xl border border-[var(--border)] p-5">
          <dt className="text-sm text-[var(--fg-muted)]">Purchases on record</dt>
          <dd className="mt-1 text-lg font-semibold">{subscriptions?.length ?? 0}</dd>
        </div>
      </dl>

      <p className="mt-10 rounded-xl border border-dashed border-[var(--border)] p-5 text-sm text-[var(--fg-muted)]">
        Sprint 0 ships the foundation only. Course progress, highlights and the notebook arrive
        in Sprint 4; checkout and entitlements in Sprint 3.
      </p>
    </div>
  );
}
