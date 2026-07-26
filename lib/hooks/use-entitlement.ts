'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { computeEntitlement, NO_ENTITLEMENT, type Entitlement } from '@/lib/entitlements';

const CACHE_KEY = 'entitled';

export type EntitlementState = Entitlement & { loading: boolean };

/**
 * Client-side entitlement.
 *
 * Queries `subscriptions` directly rather than going through an API route: RLS
 * only ever returns the caller's own rows, so the route would add a hop and a
 * second place for the rule to live.
 *
 * ⚠️  This is a UI decision, not a security boundary. Under the paywall
 * strategy the plan recommends (§11.2 Option B) the premium text is present in
 * the served HTML for everyone, so nothing here is protecting it. What this
 * protects is the *experience* — and, later, the AI endpoints, which are
 * server-checked and where the boundary is real.
 */
export function useEntitlement(): EntitlementState {
  const [state, setState] = useState<EntitlementState>({
    ...NO_ENTITLEMENT,
    loading: true,
  });

  useEffect(() => {
    let active = true;

    async function load() {
      let supabase: ReturnType<typeof createClient>;
      try {
        supabase = createClient();
      } catch (error) {
        console.warn('Supabase unavailable; treating visitor as unentitled.', error);
        if (active) setState({ ...NO_ENTITLEMENT, loading: false });
        return;
      }

      const { data, error } = await supabase.from('subscriptions').select('*');

      if (!active) return;

      if (error) {
        // Fail closed. An unreachable database must not unlock the gate.
        console.warn('Could not read entitlements.', error);
        setState({ ...NO_ENTITLEMENT, loading: false });
        writeCache(false);
        return;
      }

      const entitlement = computeEntitlement(data ?? []);
      setState({ ...entitlement, loading: false });
      writeCache(entitlement.hasAccess);
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  return state;
}

/**
 * Remembers the last known answer so a returning subscriber does not watch the
 * gate flash shut and reopen on every page load.
 *
 * Safe to spoof, and spoofing gains nothing: the flag only drives CSS, and the
 * gated text is already in the HTML that anyone can view-source. Consulted by
 * the inline script in app/layout.tsx before first paint.
 */
function writeCache(hasAccess: boolean) {
  try {
    if (hasAccess) localStorage.setItem(CACHE_KEY, '1');
    else localStorage.removeItem(CACHE_KEY);
    document.documentElement.dataset['entitled'] = hasAccess ? 'true' : 'false';
  } catch {
    // Storage disabled — the gate simply resolves after hydration instead.
  }
}

export { CACHE_KEY as ENTITLEMENT_CACHE_KEY };
