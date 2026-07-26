'use client';

import { useEntitlement } from '@/lib/hooks/use-entitlement';
import { PREMIUM_CONTENT_CLASS } from '@/lib/paywall';
import { UpgradePanel } from './upgrade-panel';
import type { ReactNode } from 'react';

/**
 * The paywall.
 *
 * Wraps gated content in an element whose class is `PREMIUM_CONTENT_CLASS` —
 * the same constant the TechArticle JSON-LD derives its `cssSelector` from
 * (CLAUDE.md #5). Neither side can be edited independently, and
 * `npm run verify:seo` asserts the served selector matches the served DOM.
 *
 * Three rules this component exists to keep:
 *
 *  1. **No user-agent sniffing** (CLAUDE.md #6). There is not a single
 *     reference to the request's UA anywhere in the paywall. Gating is decided
 *     by session state on the client, and the structured data is what explains
 *     to Google why a crawler sees more than a logged-out human does. Adding a
 *     Googlebot check here would convert legitimate flexible sampling into
 *     cloaking.
 *
 *  2. **Locked by default.** The server renders `data-gated="true"` and the
 *     client only ever opens the gate. If JavaScript fails, entitlement cannot
 *     be read, or Supabase is down, the gate stays shut — the failure mode is
 *     "a paying customer is briefly annoyed", not "the product is given away".
 *
 *  3. **A real free preview sits outside this component** (CLAUDE.md #8). A
 *     page that is 100% gated ranks poorly no matter how good the markup is.
 */
export function Gate({ children }: { children: ReactNode }) {
  const { hasAccess, loading } = useEntitlement();

  // `loading` counts as locked. Optimistically unlocking would flash the
  // content to everyone, which defeats the point and looks broken.
  const locked = !hasAccess;

  return (
    <>
      <div
        className={PREMIUM_CONTENT_CLASS}
        // Styling hangs off the data attribute rather than a conditional class
        // so the class list is byte-identical in every state — the selector
        // Google is told to look for is always exactly `.premium-content`.
        data-gated={locked ? 'true' : 'false'}
        aria-hidden={locked ? 'true' : undefined}
        // Locked content is inert: no tabbing into links the reader cannot see.
        inert={locked ? true : undefined}
      >
        {children}
      </div>

      {locked ? <UpgradePanel loading={loading} /> : null}
    </>
  );
}
