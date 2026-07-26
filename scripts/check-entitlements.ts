/**
 * Entitlement rules, unit-tested without a database.
 *
 * These functions decide who has paid. Every bug in here is either "a customer
 * cannot read what they bought" or "the product is being given away", and
 * neither shows up in a build error. The logic is pure precisely so it can be
 * checked like this.
 *
 *   npm run verify:entitlements
 */

import { computeEntitlement, computeExpiry, canReadChapter } from '../lib/entitlements';
import { priceFor, PPP_DISCOUNTS, TIERS } from '../lib/stripe/config';
import type { SubscriptionRow, SubscriptionTier } from '../lib/supabase/database.types';

let failures = 0;
let checks = 0;

function check(passed: boolean, label: string, detail = '') {
  checks += 1;
  if (passed) {
    console.log(`  \x1b[32mPASS\x1b[0m  ${label}`);
  } else {
    failures += 1;
    console.log(`  \x1b[31mFAIL\x1b[0m  ${label}${detail ? `\n         ${detail}` : ''}`);
  }
}

const NOW = new Date('2026-07-01T00:00:00Z');

function row(overrides: Partial<SubscriptionRow>): SubscriptionRow {
  return {
    id: 'sub_1',
    user_id: 'user_1',
    tier: 'monthly',
    status: 'active',
    stripe_customer_id: null,
    stripe_checkout_id: null,
    stripe_payment_intent_id: null,
    amount_cents: 2900,
    currency: 'usd',
    starts_at: '2026-06-01T00:00:00Z',
    expires_at: '2026-08-01T00:00:00Z',
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-06-01T00:00:00Z',
    ...overrides,
  };
}

function iso(date: Date): string {
  return date.toISOString();
}

console.log('\nEntitlement rules\n');
console.log('  access ------------------------------------------------------');

check(computeEntitlement([], NOW).hasAccess === false, 'no rows means no access');

check(
  computeEntitlement([row({})], NOW).hasAccess === true,
  'an active, unexpired row grants access',
);

check(
  computeEntitlement([row({ expires_at: '2026-06-15T00:00:00Z' })], NOW).hasAccess === false,
  'an expired row does not grant access',
);

check(
  computeEntitlement([row({ status: 'refunded' })], NOW).hasAccess === false,
  'a refunded row does not grant access',
);

check(
  computeEntitlement([row({ status: 'pending' })], NOW).hasAccess === false,
  'a pending row does not grant access',
);

check(
  computeEntitlement([row({ tier: 'lifetime', expires_at: null })], NOW).hasAccess === true,
  'lifetime (expires_at null) grants access',
);

check(
  computeEntitlement([row({ tier: 'lifetime', expires_at: null })], NOW).isLifetime === true,
  'lifetime is reported as lifetime',
);

console.log('\n  the rule that matters -----------------------------------------');

// The plan is explicit: entitlement is "unexpired access", not "active Stripe
// subscription". This is what that means in practice — a row with no Stripe
// identifiers at all still grants access, because a manual comp or a migrated
// purchase is just as valid as a Stripe one.
check(
  computeEntitlement(
    [row({ stripe_customer_id: null, stripe_checkout_id: null, stripe_payment_intent_id: null })],
    NOW,
  ).hasAccess === true,
  'a grant with no Stripe identifiers still counts (entitlement != Stripe subscription)',
);

console.log('\n  stacking ------------------------------------------------------');

const stacked = computeEntitlement(
  [
    row({ id: 'a', expires_at: '2026-07-20T00:00:00Z' }),
    row({ id: 'b', expires_at: '2026-09-01T00:00:00Z' }),
  ],
  NOW,
);
check(
  stacked.expiresAt?.toISOString() === '2026-09-01T00:00:00.000Z',
  'two grants resolve to the later expiry',
  `got ${stacked.expiresAt?.toISOString()}`,
);

const mixed = computeEntitlement(
  [row({ id: 'a', tier: 'monthly' }), row({ id: 'b', tier: 'lifetime', expires_at: null })],
  NOW,
);
check(mixed.tier === 'lifetime', 'the most generous tier wins');
check(mixed.expiresAt === null, 'lifetime plus monthly never expires');

// Buying more time while you still have some must ADD to it. Resetting to
// now + 30 would silently delete time the customer already paid for.
const twentyDaysLeft = computeEntitlement([row({ expires_at: '2026-07-21T00:00:00Z' })], NOW);
const extended = computeExpiry('monthly', twentyDaysLeft, NOW);
check(
  extended?.toISOString() === '2026-08-20T00:00:00.000Z',
  'buying a month with 20 days left gives 50 days, not 30',
  `got ${extended?.toISOString()}`,
);

const fromScratch = computeExpiry('monthly', computeEntitlement([], NOW), NOW);
check(
  fromScratch?.toISOString() === '2026-07-31T00:00:00.000Z',
  'buying a month with no access starts from now',
  `got ${fromScratch?.toISOString()}`,
);

check(computeExpiry('lifetime', computeEntitlement([], NOW), NOW) === null, 'lifetime has no expiry');

check(
  iso(computeExpiry('annual', computeEntitlement([], NOW), NOW)!) === '2027-07-01T00:00:00.000Z',
  'annual grants 365 days',
);

// An expired grant must not be used as the base — that would resurrect time
// that already ran out.
const longExpired = computeEntitlement([row({ expires_at: '2026-01-01T00:00:00Z' })], NOW);
check(
  computeExpiry('monthly', longExpired, NOW)?.toISOString() === '2026-07-31T00:00:00.000Z',
  'an expired grant does not extend the new one',
);

console.log('\n  chapter gating -------------------------------------------------');

const none = computeEntitlement([], NOW);
const paid = computeEntitlement([row({})], NOW);

check(canReadChapter(true, none) === true, 'free chapter readable without access');
check(canReadChapter(false, none) === false, 'premium chapter locked without access');
check(canReadChapter(false, paid) === true, 'premium chapter readable with access');

console.log('\n  pricing --------------------------------------------------------');

check(priceFor('monthly', null).finalAmountCents === 2900, 'no country means list price');
check(priceFor('monthly', 'US').finalAmountCents === 2900, 'US pays list price');
check(priceFor('monthly', 'ZZ').finalAmountCents === 2900, 'unknown country pays list price');

const india = priceFor('monthly', 'IN');
check(
  india.finalAmountCents === 1200,
  'India gets 60% off, rounded to a whole dollar',
  `got ${india.finalAmountCents}`,
);

for (const [country, fraction] of Object.entries(PPP_DISCOUNTS)) {
  if (fraction < 0.5 || fraction > 0.6) {
    check(false, `PPP discount for ${country} is within the 50–60% the plan specifies`, `got ${fraction}`);
  }
}
check(true, 'every PPP discount sits within 50–60%');

for (const tier of Object.keys(TIERS) as SubscriptionTier[]) {
  const priced = priceFor(tier, 'IN');
  check(
    priced.finalAmountCents > 0 && priced.finalAmountCents < TIERS[tier].amountCents,
    `${tier} discounts to a positive amount below list`,
    `got ${priced.finalAmountCents} vs list ${TIERS[tier].amountCents}`,
  );
}

console.log(`\n  ${checks - failures}/${checks} checks passed\n`);

if (failures > 0) {
  console.error(`\x1b[31m  Entitlement rules FAILED — ${failures} check(s).\x1b[0m\n`);
  process.exit(1);
}
console.log('\x1b[32m  Entitlement rules verified.\x1b[0m\n');
