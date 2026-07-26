/**
 * Route classification, shared by middleware and layouts.
 *
 * Kept as data so the rendering map in CLAUDE.md §3 has exactly one
 * representation in code rather than being restated in each file.
 */

/** Authenticated-only, SSR, never indexed. */
export const PROTECTED_PREFIXES = ['/dashboard', '/notebook', '/settings'] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Where to send a user after sign-in.
 *
 * Only same-origin relative paths are accepted. Taking `?next=` straight from
 * the query string would be an open redirect.
 */
export function safeRedirect(next: string | null | undefined, fallback = '/dashboard'): string {
  if (!next) return fallback;
  if (!next.startsWith('/')) return fallback;
  if (next.startsWith('//') || next.startsWith('/\\')) return fallback;
  return next;
}
