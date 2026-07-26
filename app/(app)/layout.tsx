import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SiteHeader } from '@/components/layout/site-header';

/**
 * Authenticated shell — SSR, noindex (CLAUDE.md §3 route map).
 *
 * This layout calls cookies() through the server Supabase client, which makes
 * every route beneath it dynamic. That is deliberate here and only here.
 *
 * The middleware already redirects unauthenticated requests, but this check is
 * not redundant: middleware can be bypassed by a misconfigured matcher, and
 * defence in depth on an auth boundary is worth one extra call.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/sign-in');

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        {children}
      </main>
    </div>
  );
}
