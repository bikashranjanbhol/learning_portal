import 'server-only';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { publicEnv, serverEnv } from '@/lib/env';
import type { Database } from './database.types';

/**
 * Supabase client for server components, route handlers and server actions.
 *
 * ⚠️  CLAUDE.md #2 — this calls `cookies()`, which opts the whole route into
 * dynamic rendering with no error or warning. Use it ONLY inside the (app)
 * route group, route handlers, and server actions.
 *
 * Never import this from a page under (content) or (marketing). If a content
 * page needs to know who the user is, that belongs in a client component that
 * hydrates after load.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // middleware.ts refreshes the session, so this is safe to swallow.
        }
      },
    },
  });
}

/**
 * Service-role client. Bypasses Row Level Security entirely.
 *
 * Reach for this only where a request genuinely acts on behalf of the system
 * rather than a user — the Stripe webhook in Sprint 3 is the intended case.
 * Anywhere else, use `createClient()` and let RLS do its job.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    publicEnv.supabaseUrl,
    serverEnv.supabaseServiceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
