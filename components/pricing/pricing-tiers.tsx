'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TIERS, TIER_ORDER, formatUsd } from '@/lib/stripe/config';
import { useUser } from '@/lib/hooks/use-user';
import { useEntitlement } from '@/lib/hooks/use-entitlement';
import type { SubscriptionTier } from '@/lib/supabase/database.types';

type RegionalPricing = {
  countryCode: string | null;
  discountFraction: number;
  tiers: Array<{ tier: SubscriptionTier; amountCents: number; finalAmountCents: number }>;
};

/**
 * Tier cards with checkout.
 *
 * List prices are rendered immediately from the shared config, so the page is
 * useful and correct before any JavaScript runs and stays statically
 * generated. The regional discount, if any, arrives afterwards and adjusts the
 * displayed figures.
 */
export function PricingTiers() {
  const router = useRouter();
  const { user } = useUser();
  const { hasAccess, isLifetime } = useEntitlement();

  const [regional, setRegional] = useState<RegionalPricing | null>(null);
  const [pending, setPending] = useState<SubscriptionTier | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/pricing')
      .then((response) => (response.ok ? response.json() : null))
      .then((data: RegionalPricing | null) => {
        if (active && data) setRegional(data);
      })
      .catch(() => {
        // List prices are already on screen; a failure here just means no
        // discount is shown, and checkout still applies it server-side.
      });
    return () => {
      active = false;
    };
  }, []);

  async function startCheckout(tier: SubscriptionTier) {
    setError(null);

    if (!user) {
      router.push(`/sign-in?next=${encodeURIComponent('/pricing')}`);
      return;
    }

    setPending(tier);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        setError(data.error ?? 'Could not start checkout.');
        setPending(null);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError('Could not reach the server. Please try again.');
      setPending(null);
    }
  }

  const discount = regional?.discountFraction ?? 0;

  return (
    <div>
      {discount > 0 ? (
        <p className="mb-6 rounded-lg border border-emerald-500/40 bg-emerald-500/5 px-4 py-3 text-sm">
          Regional pricing applied — {Math.round(discount * 100)}% off, based on where you are
          browsing from.
        </p>
      ) : null}

      {hasAccess ? (
        <p className="mb-6 rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-3 text-sm">
          You already have {isLifetime ? 'lifetime' : 'active'} access.{' '}
          <a href="/courses" className="underline underline-offset-2">
            Go to the courses
          </a>
          .
        </p>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {TIER_ORDER.map((tier) => {
          const config = TIERS[tier];
          const priced = regional?.tiers.find((entry) => entry.tier === tier);
          const finalCents = priced?.finalAmountCents ?? config.amountCents;
          const discounted = finalCents < config.amountCents;

          return (
            <div
              key={tier}
              className={[
                'flex flex-col rounded-xl border p-6',
                config.highlighted
                  ? 'border-[var(--accent)] ring-1 ring-[var(--accent)]'
                  : 'border-[var(--border)]',
              ].join(' ')}
            >
              <h3 className="font-semibold">{config.name}</h3>

              <p className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight">
                  {formatUsd(finalCents)}
                </span>
                {discounted ? (
                  <span className="text-sm text-[var(--fg-muted)] line-through">
                    {formatUsd(config.amountCents)}
                  </span>
                ) : null}
              </p>
              <p className="mt-1 text-xs text-[var(--fg-muted)]">{config.cadence}</p>

              <p className="mt-3 flex-1 text-sm text-pretty text-[var(--fg-muted)]">
                {config.description}
              </p>

              <button
                type="button"
                onClick={() => startCheckout(tier)}
                disabled={pending !== null || (hasAccess && isLifetime)}
                className={[
                  'mt-6 rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50',
                  config.highlighted
                    ? 'bg-[var(--accent)] text-[var(--accent-fg)]'
                    : 'border border-[var(--border)]',
                ].join(' ')}
              >
                {pending === tier
                  ? 'Opening checkout…'
                  : hasAccess && isLifetime
                    ? 'You own this'
                    : hasAccess
                      ? `Extend with ${config.name.toLowerCase()}`
                      : `Get ${config.name.toLowerCase()}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Reserved so an error appearing does not shift the cards. */}
      <p role="status" aria-live="polite" className="mt-4 min-h-5 text-sm text-red-500">
        {error ?? ''}
      </p>

      <p className="mt-2 text-xs text-[var(--fg-muted)]">
        Buying while you still have access extends it rather than replacing it.
      </p>
    </div>
  );
}
