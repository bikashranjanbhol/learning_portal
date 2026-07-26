import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  /**
   * Deliberately narrow.
   *
   * Middleware runs before the cache, so matching content routes would add an
   * Edge round-trip to every statically generated chapter page — a direct hit
   * to TTFB and therefore LCP, on the exact pages the acquisition strategy
   * depends on. Only routes that actually need a session are matched.
   *
   * When Sprint 4 adds per-user state to content pages, it hydrates client-side
   * against Supabase directly. It does not get added here.
   */
  matcher: [
    '/dashboard/:path*',
    '/notebook/:path*',
    '/settings/:path*',
    '/sign-in',
    '/sign-up',
  ],
};
