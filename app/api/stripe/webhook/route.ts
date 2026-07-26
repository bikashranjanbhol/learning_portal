import { NextResponse, type NextRequest } from 'next/server';
import type Stripe from 'stripe';
import { stripe, webhookSecret } from '@/lib/stripe/client';
import { createAdminClient } from '@/lib/supabase/server';
import { computeEntitlement, computeExpiry } from '@/lib/entitlements';
import { isTier } from '@/lib/stripe/config';

/**
 * Stripe webhook.
 *
 * CLAUDE.md #19: signature-verified and idempotent. Both matter for concrete
 * reasons:
 *
 * - **Signature.** This endpoint grants paid access and is on the public
 *   internet. Without verification, anyone who knows the URL can POST a fake
 *   `checkout.session.completed` and give themselves lifetime access.
 *
 * - **Idempotency.** Stripe delivers at-least-once and retries for three days.
 *   The same event WILL arrive twice. Without a guard, a replay grants a second
 *   30-day period — silently, and only visible as revenue that never arrived.
 *
 * Runs on Node, not Edge: signature verification needs the raw body, and
 * writes use the service-role key, which must never touch a client bundle.
 */
export const runtime = 'nodejs';
// Never cached, never prerendered.
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature.' }, { status: 400 });
  }

  // Must be the raw text. Parsing to JSON first and re-serialising changes the
  // bytes and the signature will not verify.
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(payload, signature, webhookSecret());
  } catch (error) {
    console.error('Webhook signature verification failed', error);
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  const admin = createAdminClient();

  // ---------------------------------------------------------------------
  // Idempotency gate.
  //
  // Claim the event id BEFORE doing any work. The primary key makes this
  // atomic, so two concurrent deliveries of the same event cannot both pass —
  // exactly the race a "select then insert" check would lose.
  // ---------------------------------------------------------------------
  const claim = await admin.from('processed_stripe_events').insert({
    id: event.id,
    type: event.type,
    payload_summary: { created: event.created },
  });

  if (claim.error) {
    // 23505 = unique_violation: already handled. Return 200 so Stripe stops
    // retrying — a non-2xx here would make it redeliver forever.
    if (claim.error.code === '23505') {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error('Could not record webhook event', claim.error);
    // A real failure: 500 asks Stripe to retry, which is what we want.
    return NextResponse.json({ error: 'Ledger write failed.' }, { status: 500 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await grantAccess(admin, event.data.object);
        break;

      case 'charge.refunded':
        await revokeForCharge(admin, event.data.object);
        break;

      case 'charge.dispute.created':
        // A dispute is not yet a refund, but access should stop while it is
        // being contested — otherwise the disputed content keeps being served.
        await revokeForCharge(admin, event.data.object as unknown as Stripe.Charge, 'refunded');
        break;

      default:
        // Unhandled types are fine; the ledger row records that we saw it.
        break;
    }
  } catch (error) {
    console.error(`Handler failed for ${event.type} (${event.id})`, error);

    // Release the claim so Stripe's retry can try again — otherwise the
    // idempotency gate would permanently swallow an event that never applied.
    await admin.from('processed_stripe_events').delete().eq('id', event.id);

    return NextResponse.json({ error: 'Handler failed.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Grant access for a completed checkout.
 *
 * The expiry stacks onto any access the user already has, so buying a second
 * month with twenty days left gives fifty days rather than thirty.
 */
async function grantAccess(admin: Admin, session: Stripe.Checkout.Session) {
  // Only grant on an actually-paid session. `completed` can fire for sessions
  // where payment is still processing.
  if (session.payment_status !== 'paid') {
    console.warn(`Session ${session.id} completed but payment_status is ${session.payment_status}`);
    return;
  }

  const userId = session.metadata?.['user_id'] ?? session.client_reference_id;
  const tier = session.metadata?.['tier'];

  if (!userId || !isTier(tier)) {
    throw new Error(`Session ${session.id} is missing user_id or a valid tier in metadata`);
  }

  // Read current access so the new grant extends rather than replaces it.
  const { data: existing, error: readError } = await admin
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId);

  if (readError) throw new Error(`Could not read subscriptions: ${readError.message}`);

  const current = computeEntitlement(existing ?? []);
  const expiresAt = computeExpiry(tier, current);

  const { error } = await admin.from('subscriptions').insert({
    user_id: userId,
    tier,
    status: 'active',
    stripe_customer_id: typeof session.customer === 'string' ? session.customer : null,
    // UNIQUE. The second line of defence: even if the event ledger were
    // bypassed, this insert fails rather than granting twice.
    stripe_checkout_id: session.id,
    stripe_payment_intent_id:
      typeof session.payment_intent === 'string' ? session.payment_intent : null,
    amount_cents: session.amount_total,
    currency: session.currency ?? 'usd',
    expires_at: expiresAt ? expiresAt.toISOString() : null,
  });

  if (error) {
    if (error.code === '23505') {
      // Already granted for this checkout — nothing to do, and not an error.
      console.warn(`Duplicate grant suppressed for session ${session.id}`);
      return;
    }
    throw new Error(`Could not grant access: ${error.message}`);
  }
}

/** Revoke access tied to a charge — refund or dispute. */
async function revokeForCharge(
  admin: Admin,
  charge: Stripe.Charge,
  status: 'refunded' = 'refunded',
) {
  const paymentIntent =
    typeof charge.payment_intent === 'string' ? charge.payment_intent : null;

  if (!paymentIntent) {
    console.warn(`Charge ${charge.id} has no payment_intent; cannot match a subscription`);
    return;
  }

  // Partial refunds do not revoke: someone refunded $5 of $79 still bought it.
  if (charge.amount_refunded > 0 && charge.amount_refunded < charge.amount) {
    console.warn(`Partial refund on ${charge.id}; leaving access in place`);
    return;
  }

  const { error } = await admin
    .from('subscriptions')
    .update({ status })
    .eq('stripe_payment_intent_id', paymentIntent);

  if (error) throw new Error(`Could not revoke access: ${error.message}`);
}
