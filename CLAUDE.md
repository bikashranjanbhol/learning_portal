# Project context — learning platform

Drop this file at the repo root. Claude Code / Cursor read it automatically on every request,
so these constraints stay in force without being re-pasted each time.

---

## What this is

An interview-prep learning platform: courses on system design, low-level design, and DSA,
delivered as MDX chapters with interactive animations, gated behind a paywall.
Solo developer, bootstrapped, ~4–6 hours of build time per week.

**Primary business constraint: organic search and AI-citation discoverability are the entire
acquisition strategy.** Any change that hurts crawlability or Core Web Vitals is a business
problem, not a technical preference. Treat SEO regressions as bugs of the same severity as
a broken checkout.

---

## Stack

- Next.js 15+, App Router, TypeScript strict, Tailwind
- Supabase (Postgres + Auth + Storage), Row Level Security on every user-scoped table
- Stripe (or Lemon Squeezy as Merchant of Record for VAT)
- MDX content committed to git under `/content` — no external CMS
- Vercel hosting
- PostHog analytics

---

## Hard constraints — do not violate without explicitly flagging it first

### Rendering

1. **Default to SSG + ISR. Use per-request SSR only when the HTML depends on who is logged in.**
   Content pages must export `generateStaticParams()` and `export const revalidate = <seconds>`.
2. **Never call `cookies()`, `headers()`, or `searchParams` inside a content page.** It silently
   opts the entire route into dynamic rendering and static generation is lost with no error.
   Personalisation goes in client components that hydrate after load.
3. Route rendering map:
   - `/`, `/courses`, `/premium`, `/pricing` → SSG
   - `/learn/[course]/[chapter]`, `/blog/[slug]` → SSG + ISR 3600
   - `/practice/patterns/[pattern]` → SSG + ISR 21600
   - `/compare/[slug]` → SSG + ISR 604800
   - `/dashboard`, `/notebook`, `/settings` → SSR, `noindex`
4. Use `revalidateTag()` on content publish rather than full rebuilds.

### Paywall — highest-risk area in the codebase

5. Gated content must be wrapped in an element with class **`.premium-content`**, and the
   `TechArticle` JSON-LD must declare a nested `hasPart` `WebPageElement` with
   `cssSelector: ".premium-content"` and `isAccessibleForFree: false`.
   **The selector in the JSON-LD and the class in the DOM must match exactly.**
   A mismatch is treated by Google as cloaking, not as a bug, and risks de-indexing.
6. **Never branch on user-agent to detect Googlebot.** Gate on session state only; let the
   structured data explain the difference between what crawlers and users see.
7. Free chapters must emit `isAccessibleForFree: true`. Do not blanket-apply the paywall flag.
8. Every gated page needs a genuine free preview above the gate — intro, headings, first example.

### SEO / AEO

9. Every route implements `generateMetadata()` with title, description, canonical, OG, Twitter.
10. Maintain `app/sitemap.ts` and `app/robots.ts` as code, not static files.
11. `robots.ts`: allow `GPTBot`, `ClaudeBot`, `PerplexityBot` on free content paths;
    disallow them on `/learn/*` premium paths, `/api/`, `/dashboard/`, `/settings/`.
12. Content pages answer their core question in the **first 60 words**, then go deep.
    H2s are phrased as questions where natural.
13. JSON-LD components live in `components/seo/` and are typed. Never hand-write raw JSON-LD
    inline in a page.

### Performance budget — treat as build-blocking

14. LCP < 2.0s, INP < 200ms, CLS < 0.1 on mobile for a representative chapter page.
15. Animations load via `dynamic(() => import(...), { ssr: false })`, mount on
    `IntersectionObserver`, and always reserve dimensions with an aspect-ratio box.
16. `next/image` with explicit width and height everywhere; `next/font` for all fonts.

### Security / cost

17. RLS enabled on `progress`, `highlights`, `subscriptions`, `ai_usage` from the first migration.
18. AI endpoints: paid users only, rate-limited per user *and* per IP, with a hard monthly
    spend ceiling and usage logged to `ai_usage`. AI cost is variable and untied to revenue —
    an unmetered endpoint is a real financial risk, not a hypothetical one.
19. Stripe webhooks must be signature-verified and idempotent.

---

## Pricing model (affects entitlement logic)

- Free tier — ~35% of content, animations preview-only, no AI
- Monthly $29 — **one-time, no auto-renewal** (not a recurring subscription)
- Annual $79 — includes the newsletter
- Lifetime $179
- PPP discounts 50–60% for India, Brazil, SEA via IP detection

Entitlement is therefore "does the user have unexpired access", not "is there an active
Stripe subscription". Model it that way from the start — retrofitting this is painful.

---

## Working style

- Small, reviewable commits. One concern per commit.
- Ask before adding a dependency. The stack above is deliberately minimal.
- Do not add Redis, a queue, microservices, Algolia, or Docker orchestration.
  Traffic is zero. Postgres full-text search is sufficient until it demonstrably isn't.
- Prefer server components. Add `"use client"` only where interactivity genuinely requires it.
- When a request conflicts with a constraint above, say so and propose an alternative
  rather than silently working around it.
