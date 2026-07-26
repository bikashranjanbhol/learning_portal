import type { SubscriptionTier } from '@/lib/supabase/database.types';

/**
 * Pricing and regional discounts.
 *
 * Shared by the pricing page, the checkout route and the tests, so a price can
 * only be wrong in one place.
 */

export type TierConfig = {
  tier: SubscriptionTier;
  name: string;
  /** Base price in cents, USD, before any regional adjustment. */
  amountCents: number;
  description: string;
  cadence: string;
  highlighted?: boolean;
};

export const TIERS: Record<SubscriptionTier, TierConfig> = {
  monthly: {
    tier: 'monthly',
    name: 'Monthly',
    amountCents: 2900,
    // Not a Stripe subscription. mode: 'payment', one charge, 30 days of
    // access, nothing on file. See lib/entitlements.ts.
    description: 'A single payment for 30 days. It does not renew itself.',
    cadence: 'one-time, 30 days',
  },
  annual: {
    tier: 'annual',
    name: 'Annual',
    amountCents: 7900,
    description: 'The sensible option if you are more than a month from interviewing.',
    cadence: 'one-time, 12 months',
    highlighted: true,
  },
  lifetime: {
    tier: 'lifetime',
    name: 'Lifetime',
    amountCents: 17900,
    description: 'Pay once. Includes everything added later.',
    cadence: 'one-time, forever',
  },
};

export const TIER_ORDER: SubscriptionTier[] = ['monthly', 'annual', 'lifetime'];

/**
 * Purchasing-power parity discounts.
 *
 * Two-letter ISO country codes to a discount fraction. The plan specifies
 * 50–60% for India, Brazil and South East Asia.
 *
 * The discount is applied server-side when the Checkout Session is created,
 * from the country the request actually came from. It is never taken from the
 * client, because a client-supplied country is just a free discount for anyone
 * who reads the network tab.
 *
 * This is honour-system pricing: a VPN defeats it. That is a deliberate
 * trade-off — the alternative is card-country verification, which rejects
 * legitimate customers who bank abroad.
 */
export const PPP_DISCOUNTS: Record<string, number> = {
  IN: 0.6, // India
  BR: 0.55, // Brazil
  ID: 0.6, // Indonesia
  PH: 0.55, // Philippines
  VN: 0.6, // Vietnam
  TH: 0.5, // Thailand
  MY: 0.5, // Malaysia
  PK: 0.6, // Pakistan
  BD: 0.6, // Bangladesh
  LK: 0.6, // Sri Lanka
  NG: 0.6, // Nigeria
  EG: 0.55, // Egypt
};

export type PricedTier = TierConfig & {
  finalAmountCents: number;
  discountFraction: number;
  countryCode: string | null;
};

export function priceFor(tier: SubscriptionTier, countryCode: string | null): PricedTier {
  const config = TIERS[tier];
  const discount = countryCode ? (PPP_DISCOUNTS[countryCode] ?? 0) : 0;

  // Round to a whole dollar. $11.60 reads as an accident; $12 reads as a price.
  const discounted = Math.round((config.amountCents * (1 - discount)) / 100) * 100;

  return {
    ...config,
    finalAmountCents: discount > 0 ? discounted : config.amountCents,
    discountFraction: discount,
    countryCode,
  };
}

export function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

export function isTier(value: unknown): value is SubscriptionTier {
  return value === 'monthly' || value === 'annual' || value === 'lifetime';
}
