/**
 * Environment access.
 *
 * Values are read lazily through functions rather than validated at module
 * scope. Module-scope validation would throw during `next build` while
 * prerendering static pages on a machine that has no secrets (CI, a fresh
 * clone), which turns a missing optional key into a broken build.
 */

function read(name: string, value: string | undefined): string {
  if (!value || value.length === 0) {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value;
}

/**
 * `process.env.NEXT_PUBLIC_*` must be referenced as a static property access so
 * Next can inline it into the client bundle at build time. Dynamic lookups
 * (`process.env[name]`) are not replaced and come back undefined in the browser.
 */
export const publicEnv = {
  get supabaseUrl(): string {
    return read('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL);
  },
  get supabaseAnonKey(): string {
    return read('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  },
};

export const serverEnv = {
  /** Bypasses RLS. Server-only — importing this into a client component is a bug. */
  get supabaseServiceRoleKey(): string {
    return read('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY);
  },
};

/**
 * Absolute site origin, no trailing slash.
 *
 * Falls back to the Vercel-provided URL so preview deploys produce correct
 * OAuth redirects without per-branch configuration.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, '');

  const vercel = process.env.NEXT_PUBLIC_VERCEL_URL ?? process.env.VERCEL_URL;
  if (vercel) return `https://${vercel.replace(/\/$/, '')}`;

  return 'http://localhost:3000';
}

export const isProduction = process.env.NODE_ENV === 'production';
