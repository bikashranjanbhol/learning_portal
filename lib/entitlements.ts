import type { SubscriptionRow, SubscriptionTier } from '@/lib/supabase/database.types';

/**
 * Entitlement — the definition of "has this person paid".
 *
 * The whole file exists to enforce one sentence from the plan: entitlement is
 * **"does this user have unexpired access"**, never "is there an active Stripe
 * subscription".
 *
 * That is not a stylistic preference. The monthly tier is a ONE-TIME $29
 * payment granting 30 days, with no auto-renewal — so there is no Stripe
 * subscription object to ask. Code that reaches for `stripe.subscriptions` here
 * is answering a question this product does not have.
 *
 * Access is the union of unexpired grants. Two monthly purchases produce two
 * rows and access until the later expiry; they do not overwrite each other.
 *
 * Pure functions, no I/O, so the rules can be unit-tested without a database —
 * see scripts/check-entitlements.ts.
 */

export const TIER_DURATION_DAYS: Record<SubscriptionTier, number | null> = {
  monthly: 30,
  annual: 365,
  // null = never expires. Stored as expires_at IS NULL, enforced by a CHECK
  // constraint in the migration so a lifetime row cannot carry an expiry.
  lifetime: null,
};

export type Entitlement = {
  hasAccess: boolean;
  /** The most generous tier currently granting access. */
  tier: SubscriptionTier | null;
  /** null with hasAccess true means lifetime. */
  expiresAt: Date | null;
  isLifetime: boolean;
  /** For the renewal nudge. null when lifetime or when there is no access. */
  daysRemaining: number | null;
};

export const NO_ENTITLEMENT: Entitlement = {
  hasAccess: false,
  tier: null,
  expiresAt: null,
  isLifetime: false,
  daysRemaining: null,
};

/** Ordering for "most generous tier", not for price. */
const TIER_RANK: Record<SubscriptionTier, number> = { monthly: 1, annual: 2, lifetime: 3 };

function isGranting(row: SubscriptionRow, now: Date): boolean {
  // 'refunded', 'expired' and 'pending' all fail here. A refunded purchase
  // stops granting access the moment the webhook lands.
  if (row.status !== 'active') return false;
  if (row.expires_at === null) return true; // lifetime
  return new Date(row.expires_at) > now;
}

/**
 * Reduce a user's subscription rows to a single entitlement.
 *
 * Deliberately takes rows rather than fetching them, so the same logic runs on
 * the server, in the client hook, and in tests — one definition, three callers.
 */
export function computeEntitlement(
  rows: readonly SubscriptionRow[],
  now: Date = new Date(),
): Entitlement {
  const granting = rows.filter((row) => isGranting(row, now));
  if (granting.length === 0) return NO_ENTITLEMENT;

  const isLifetime = granting.some((row) => row.expires_at === null);

  const tier = granting.reduce<SubscriptionTier>((best, row) => {
    return TIER_RANK[row.tier] > TIER_RANK[best] ? row.tier : best;
  }, granting[0]!.tier);

  if (isLifetime) {
    return { hasAccess: true, tier, expiresAt: null, isLifetime: true, daysRemaining: null };
  }

  // Latest expiry wins: stacked purchases extend access rather than replace it.
  const expiresAt = granting.reduce<Date>((latest, row) => {
    const candidate = new Date(row.expires_at!);
    return candidate > latest ? candidate : latest;
  }, new Date(0));

  const daysRemaining = Math.max(
    0,
    Math.ceil((expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
  );

  return { hasAccess: true, tier, expiresAt, isLifetime: false, daysRemaining };
}

/**
 * When a newly purchased tier should expire.
 *
 * Stacks onto existing access rather than starting from now — buying a second
 * month while twenty days remain should give fifty days, not thirty. Starting
 * from `now` would silently delete time the user already paid for.
 */
export function computeExpiry(
  tier: SubscriptionTier,
  current: Entitlement,
  now: Date = new Date(),
): Date | null {
  const days = TIER_DURATION_DAYS[tier];
  if (days === null) return null; // lifetime

  const base =
    current.hasAccess && current.expiresAt && current.expiresAt > now ? current.expiresAt : now;

  const expiry = new Date(base);
  expiry.setUTCDate(expiry.getUTCDate() + days);
  return expiry;
}

/** Whether a chapter should be readable, given its flag and the entitlement. */
export function canReadChapter(chapterIsFree: boolean, entitlement: Entitlement): boolean {
  return chapterIsFree || entitlement.hasAccess;
}
