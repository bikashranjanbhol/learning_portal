import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/client';
import { siteUrl } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Stripe customer portal.
 *
 * Worth being clear about what this is and is not for here. There are no
 * recurring subscriptions to cancel — every tier is a one-time payment. The
 * portal exists so a customer can retrieve invoices and update their billing
 * details, which Stripe expects to be reachable and which some card issuers
 * look for.
 *
 * If the portal is ever configured with subscription-cancellation features
 * enabled, it will show controls for something this product does not have.
 * Configure it in the Stripe dashboard with invoice history only.
 */
export async function POST(request: NextRequest) {
  void request;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  }

  // Most recent Stripe customer id recorded for this user. RLS restricts the
  // read to their own rows, so this cannot surface someone else's customer.
  const { data, error } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .not('stripe_customer_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Could not read customer id', error);
    return NextResponse.json({ error: 'Could not open the billing portal.' }, { status: 500 });
  }

  const customerId = data?.stripe_customer_id;
  if (!customerId) {
    return NextResponse.json(
      { error: 'No purchases found on this account.' },
      { status: 404 },
    );
  }

  try {
    const session = await stripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${siteUrl()}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (caught) {
    console.error('Portal session creation failed', caught);
    return NextResponse.json({ error: 'Could not open the billing portal.' }, { status: 502 });
  }
}
