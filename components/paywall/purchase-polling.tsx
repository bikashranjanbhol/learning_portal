'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { computeEntitlement } from '@/lib/entitlements';

const MAX_ATTEMPTS = 10;
const INTERVAL_MS = 1500;

/**
 * Waits for the webhook grant to land after a purchase.
 *
 * Stripe redirects the buyer back immediately; the webhook that grants access
 * arrives separately. Usually the gap is under a second, occasionally it is
 * several. Polling for ~15 seconds covers the realistic worst case without
 * spinning forever if something genuinely broke.
 *
 * Gives up gracefully rather than hanging: a stuck spinner tells a paying
 * customer nothing, while "email me" gives them a way out.
 */
export function PurchasePolling({ initiallyHasAccess }: { initiallyHasAccess: boolean }) {
  const [hasAccess, setHasAccess] = useState(initiallyHasAccess);
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    if (hasAccess) return;

    let attempts = 0;
    let cancelled = false;

    const timer = window.setInterval(async () => {
      attempts += 1;

      if (attempts > MAX_ATTEMPTS) {
        window.clearInterval(timer);
        if (!cancelled) setGaveUp(true);
        return;
      }

      try {
        const supabase = createClient();
        const { data } = await supabase.from('subscriptions').select('*');
        if (cancelled) return;

        if (computeEntitlement(data ?? []).hasAccess) {
          window.clearInterval(timer);
          setHasAccess(true);
          try {
            localStorage.setItem('entitled', '1');
          } catch {
            // Storage unavailable — the gate resolves after hydration instead.
          }
        }
      } catch {
        // Transient; the next tick tries again.
      }
    }, INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [hasAccess]);

  // Fixed height across all three states so the buttons below never move.
  return (
    <div className="mt-3 flex min-h-14 items-center justify-center" aria-live="polite">
      {hasAccess ? (
        <p className="text-pretty text-[var(--fg-muted)]">
          Your access is active. Every chapter is unlocked.
        </p>
      ) : gaveUp ? (
        <p className="text-pretty text-[var(--fg-muted)]">
          Your payment went through, but access is taking longer than usual to activate. It
          normally appears within a minute — refresh, and if it still has not, reply to your
          receipt email and it will be sorted out.
        </p>
      ) : (
        <p className="text-pretty text-[var(--fg-muted)]">Activating your access…</p>
      )}
    </div>
  );
}
