import { NextResponse, type NextRequest } from 'next/server';
import { PPP_DISCOUNTS, TIER_ORDER, priceFor } from '@/lib/stripe/config';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * Region-adjusted prices for the current visitor.
 *
 * This exists so `/pricing` can stay statically generated (CLAUDE.md §3). The
 * page ships with list prices in the HTML and this route fills in the regional
 * discount after hydration. Reading the country header in the page itself would
 * make the whole route dynamic and, worse, would make the page uncacheable for
 * everyone in order to personalise it for a minority.
 *
 * The number returned here is for display only. The authoritative price is
 * computed again server-side in the checkout route from the same header, so a
 * tampered response buys nothing.
 */
export function GET(request: NextRequest) {
  const countryCode =
    request.headers.get('x-vercel-ip-country') ?? request.headers.get('cf-ipcountry') ?? null;

  const discountFraction = countryCode ? (PPP_DISCOUNTS[countryCode] ?? 0) : 0;

  return NextResponse.json(
    {
      countryCode,
      discountFraction,
      tiers: TIER_ORDER.map((tier) => {
        const priced = priceFor(tier, countryCode);
        return {
          tier,
          amountCents: priced.amountCents,
          finalAmountCents: priced.finalAmountCents,
        };
      }),
    },
    {
      headers: {
        // Cache per country at the edge — the answer is identical for everyone
        // in a given country, so this should not hit the function each time.
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        Vary: 'x-vercel-ip-country',
      },
    },
  );
}
