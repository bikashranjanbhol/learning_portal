import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { publicEnv } from '@/lib/env';
import { isProtectedPath } from '@/lib/routes';
import type { Database } from './database.types';

/**
 * Refreshes the Supabase auth cookie and guards protected routes.
 *
 * This runs on the Edge for matched requests only — see the matcher in
 * /middleware.ts, which deliberately excludes content routes so their cached
 * static HTML is served without invoking this at all.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getUser() revalidates the JWT against Supabase. getSession() only decodes
  // the cookie, which a client can forge — never use it for an auth decision.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && isProtectedPath(pathname)) {
    const signIn = request.nextUrl.clone();
    signIn.pathname = '/sign-in';
    signIn.search = '';
    signIn.searchParams.set('next', pathname);
    return NextResponse.redirect(signIn);
  }

  if (user && (pathname === '/sign-in' || pathname === '/sign-up')) {
    const dashboard = request.nextUrl.clone();
    dashboard.pathname = '/dashboard';
    dashboard.search = '';
    return NextResponse.redirect(dashboard);
  }

  return response;
}
