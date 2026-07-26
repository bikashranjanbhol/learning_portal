import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { computeEntitlement } from '@/lib/entitlements';
import { PurchasePolling } from '@/components/paywall/purchase-polling';

export const metadata: Metadata = {
  title: 'Thanks for your purchase',
  robots: { index: false, follow: false },
};

/**
 * Post-purchase landing page.
 *
 * Lives under the (app) group, so it is already SSR + noindex and behind auth.
 *
 * The subtlety here: Stripe redirects the buyer back the instant payment
 * succeeds, but the webhook that actually grants access is a separate,
 * asynchronous delivery. It usually lands within a second — but not always, and
 * a page that says "you're all set" before the grant exists sends people
 * straight to a chapter that is still locked.
 *
 * So this renders whatever the truth is right now and lets a small client
 * component poll until the grant appears. Access is never granted here; this
 * page only observes. Granting on the success redirect would mean anyone who
 * could guess the URL could grant themselves access without paying.
 */
export default async function PurchaseSuccessPage() {
  const supabase = await createClient();
  const { data } = await supabase.from('subscriptions').select('*');
  const entitlement = computeEntitlement(data ?? []);

  return (
    <div className="mx-auto max-w-lg py-10 text-center">
      <div className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-6"
          aria-hidden="true"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>

      <h1 className="mt-6 text-2xl font-semibold tracking-tight">Payment received</h1>

      <PurchasePolling initiallyHasAccess={entitlement.hasAccess} />

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/courses"
          className="rounded-lg bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--accent-fg)]"
        >
          Start reading
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg border border-[var(--border)] px-5 py-3 text-sm font-semibold"
        >
          Your account
        </Link>
      </div>

      <p className="mt-8 text-xs text-[var(--fg-muted)]">
        A receipt is on its way to your email. Nothing will be charged again — none of the plans
        renew.
      </p>
    </div>
  );
}
