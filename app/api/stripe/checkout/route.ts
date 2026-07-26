import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/client';
import { isTier, priceFor } from '@/lib/stripe/config';
import { siteUrl } from '@/lib/env';

/**
 * Creates a Stripe Checkout Session.
 *
 * All three tiers are `mode: 'payment'` — one-time charges, not subscriptions.
 * The monthly tier is a 30-day grant, not a recurring plan, so there is no
 * Stripe subscription object anywhere in this system. Using `mode: 'subscription'`
 * here would put a card on file and start billing people monthly, which is
 * the opposite of what the pricing page promises.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const tier = (body as { tier?: unknown } | null)?.tier;
  if (!isTier(tier)) {
    return NextResponse.json({ error: 'Unknown tier.' }, { status: 400 });
  }

  // Country comes from the edge, never from the client. A client-supplied
  // country would be a self-service discount for anyone who opens devtools.
  const countryCode =
    request.headers.get('x-vercel-ip-country') ??
    request.headers.get('cf-ipcountry') ??
    null;

  const priced = priceFor(tier, countryCode);
  const origin = siteUrl();

  try {
    const session = await stripe().checkout.sessions.create({
      mode: 'payment',
      // Pre-filling from the session means the receipt goes to the account
      // that gets the access, not to whatever the buyer types.
      customer_email: user.email,
      client_reference_id: user.id,

      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: priced.finalAmountCents,
            product_data: {
              name: `${priced.name} access`,
              description: priced.description,
            },
          },
        },
      ],

      // The webhook is the only thing that grants access, and it reads these.
      // client_reference_id can be dropped by some flows, so user_id is
      // duplicated into metadata rather than relied on from one place.
      metadata: {
        user_id: user.id,
        tier,
        base_amount_cents: String(priced.amountCents),
        discount_fraction: String(priced.discountFraction),
        country: countryCode ?? '',
      },

      success_url: `${origin}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?checkout=cancelled`,

      // Lets Stripe collect the buyer's address for tax purposes. Note this
      // does not handle VAT remittance — see the note in the README about a
      // Merchant of Record, which the plan's pre-launch checklist requires.
      billing_address_collection: 'auto',
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return NextResponse.json({ error: 'Stripe returned no checkout URL.' }, { status: 502 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    // Never leak Stripe's message to the client — it can contain account
    // details. Log it, return something a person can act on.
    console.error('Checkout session creation failed', error);
    return NextResponse.json(
      { error: 'Could not start checkout. Please try again.' },
      { status: 502 },
    );
  }
}
