'use client';

import { createBrowserClient } from '@supabase/ssr';
import { publicEnv } from '@/lib/env';
import type { Database } from './database.types';

type BrowserClient = ReturnType<typeof createBrowserClient<Database>>;

let cached: BrowserClient | undefined;

/**
 * Supabase client for client components.
 *
 * Called lazily (inside effects or event handlers, never at module scope) so it
 * does not run while a client component is being prerendered on the server
 * during static generation.
 */
export function createClient(): BrowserClient {
  cached ??= createBrowserClient<Database>(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey);
  return cached;
}
