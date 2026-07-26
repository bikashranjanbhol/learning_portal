import 'server-only';

import Stripe from 'stripe';

/**
 * Stripe SDK instance.
 *
 * Constructed lazily so a build without STRIPE_SECRET_KEY does not fail — the
 * same reason lib/env.ts reads everything through getters. CI builds with
 * placeholder env and must not need real credentials.
 */
let cached: Stripe | undefined;

export function stripe(): Stripe {
  if (cached) return cached;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      'Missing STRIPE_SECRET_KEY. Copy .env.example to .env.local and add your test-mode key.',
    );
  }

  cached = new Stripe(key, {
    // Pinned to what stripe@22.3.2 ships. Stripe puts breaking changes behind
    // API versions, so an unpinned integration can start failing because of a
    // change nobody in this repo made. Bump this deliberately, with the
    // changelog open, when upgrading the SDK.
    apiVersion: '2026-06-24.dahlia',
    typescript: true,
    appInfo: { name: 'learning-platform' },
  });

  return cached;
}

export function webhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error(
      'Missing STRIPE_WEBHOOK_SECRET. Run `stripe listen --forward-to localhost:3000/api/stripe/webhook` and copy the whsec_… it prints.',
    );
  }
  return secret;
}
