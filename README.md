# Learning platform

Interview-prep courses on system design, low-level design, and DSA — MDX chapters with
interactive animations, gated behind a paywall.

**Sprints 0 (foundation), 1 (content pipeline) and 2 (SEO/AEO) are complete.** Sprints 3–5 are
specified in [`docs/implementation-prompts.md`](docs/implementation-prompts.md).

Pages you can look at right now: `/`, `/courses`, `/courses/system-design-beginner`,
`/learn/system-design/<chapter>` (three of them), `/blog`, `/blog/<slug>`, `/pricing`,
`/sign-in`, `/dashboard`.

## Adding content

Chapters are MDX files under `content/courses/<course>/`, ordered by the `order`
frontmatter field. A course needs a `course.json` beside its chapters. Blog posts
go in `content/blog/`. Nothing is registered anywhere — drop the file in and it
appears, because `generateStaticParams` walks the directory.

```mdx
---
title: How does X work?
slug: how-x-works
description: One sentence that also answers the question. Used for meta description and cards.
order: 4
isFree: false
publishedAt: '2026-08-01'
---

Answer the question in the first 60 words, then go deep.

## Phrase H2s as questions where it reads naturally

<Callout variant="tip" title="Available without importing">
  Variants: note, tip, warning, gotcha.
</Callout>
```

A `publishedAt` in the future is a draft: it renders in `npm run dev` and is excluded
from production builds.

Before changing anything, read [`CLAUDE.md`](CLAUDE.md). It holds the hard constraints — the
rendering rules and the paywall/SEO contract in particular are business requirements, not style
preferences.

---

## Stack

| Concern     | Choice                                                     |
| ----------- | ---------------------------------------------------------- |
| Framework   | Next.js 15 (App Router), React 19, TypeScript strict       |
| Styling     | Tailwind CSS v4 (CSS-first config, no JS config file)      |
| Data / auth | Supabase (Postgres + Auth), RLS on every user-scoped table |
| Hosting     | Vercel                                                     |
| Content     | MDX committed to git under `/content` (Sprint 1)           |

No Redis, no queue, no Docker, no search service. Postgres is sufficient at this traffic.

---

## Local setup

Requires **Node 20.11+** and a Supabase project (the free tier is fine).

```bash
node -v          # must be v20.11 or newer
```

On an older Node, `npm run dev` fails with `SyntaxError: Unexpected token '??='`
from inside `node_modules/next`. That is Node being too old to parse Next's
source, not a bug in this codebase. `.nvmrc` pins the expected version:

```bash
nvm use          # or: nvm install
```

Then:

```bash
git clone <your-repo> && cd <your-repo>
npm install
cp .env.example .env.local     # then fill in the Supabase values
```

### 1. Supabase project

Create a project at [supabase.com/dashboard](https://supabase.com/dashboard). From
**Project Settings → API**, copy into `.env.local`:

| Dashboard field | Variable                        |
| --------------- | ------------------------------- |
| Project URL     | `NEXT_PUBLIC_SUPABASE_URL`      |
| `anon` `public` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role`  | `SUPABASE_SERVICE_ROLE_KEY`     |

The service-role key bypasses RLS. It is server-only — never prefix it with `NEXT_PUBLIC_`.

### 2. Apply the migration

With the [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

Or paste `supabase/migrations/20260726000000_init.sql` into the dashboard SQL editor.

### 3. Configure auth providers

**Supabase → Authentication → URL Configuration**

- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/auth/callback`, `http://localhost:3000/auth/confirm`,
  plus `https://your-domain.com/**` and your Vercel preview pattern
  (`https://*-<your-team>.vercel.app/**`) once deployed.

**Google** — create an OAuth client in the
[Google Cloud console](https://console.cloud.google.com/apis/credentials), authorised redirect
URI `https://<project-ref>.supabase.co/auth/v1/callback`. Paste the client ID and secret into
Supabase → Authentication → Providers → Google.

**GitHub** — [register an OAuth app](https://github.com/settings/developers), callback URL
`https://<project-ref>.supabase.co/auth/v1/callback`. Paste the client ID and secret into
Supabase → Authentication → Providers → GitHub.

**Magic link** — enabled by default. The default email template points at `{{ .ConfirmationURL }}`,
which uses the implicit flow. This app uses the token-hash flow instead, so edit
**Authentication → Email Templates → Magic Link** to:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink">Sign in</a>
```

Without this change the session lands in a URL fragment, which never reaches the server, and
server components will see a logged-out user.

### 4. Run

```bash
npm run dev     # http://localhost:3000
```

---

## Commands

| Command                 | What it does                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| `npm run dev`           | Dev server                                                                                                    |
| `npm run build`         | Production build. **Check the route table it prints** — see below                                             |
| `npm run typecheck`     | `tsc --noEmit`                                                                                                |
| `npm run lint`          | ESLint                                                                                                        |
| `npm run format`        | Prettier write                                                                                                |
| `npm run verify:rls`    | Proves RLS blocks cross-user access. Needs the service-role key                                               |
| `npm run verify:static` | Checks no content/marketing route imports a dynamic API. `-- --self-test` proves the guard itself still works |
| `npm run verify:seo`    | Asserts canonical, metadata, JSON-LD and paywall markup on every route. Needs a running server                |
| `npm run db:types`      | Regenerate `lib/supabase/database.types.ts` from the linked project                                           |

### Verifying SEO and the paywall markup

```bash
npm run build
npm run start &
npm run verify:seo
```

Checks every route for a self-referencing absolute canonical, title, description, OG and
Twitter tags, and parseable JSON-LD of the expected types. It also runs the check that matters
most in this codebase: **the `cssSelector` in the served TechArticle JSON-LD must match an
element in the served HTML.** A mismatch there is read by Google as cloaking, not as a bug.

That assertion deliberately compares the emitted selector against the emitted HTML rather than
against `PREMIUM_CONTENT_SELECTOR`. Comparing against the constant is tautological — rename it
and both sides move together while the DOM silently disagrees, which is exactly the drift the
check exists to catch.

### Verifying RLS

```bash
set -a && source .env.local && set +a
npm run verify:rls
```

Creates two throwaway users, seeds a subscription for each, then acts as each user's JWT and
asserts every cross-user read and write is refused — including the one that matters
commercially, a user granting themselves lifetime access. Exits non-zero on any failure and
cleans up after itself. Run it against a development project.

---

## Reading the build output

The route table `npm run build` prints is the check that matters most in this codebase:

```
┌ ○ /                        ← Static.  Correct.
├ ○ /sign-in                 ← Static.  Correct.
├ ƒ /auth/callback           ← Dynamic. Correct — route handler.
└ ƒ /dashboard               ← Dynamic. Correct — SSR + noindex by design.
```

`○` static, `●` SSG with params, `ƒ` dynamic.

**A content route showing `ƒ` is a bug**, and it is the specific bug this stack fails silently
on. Calling `cookies()`, `headers()` or reading `searchParams` anywhere in a page — including
transitively, through a layout or a shared component — opts the whole route into per-request
rendering with no error and no warning. The only symptom is this table, and, months later, the
traffic that never arrived.

The most likely way it happens here: importing `lib/supabase/server.ts` into a content page.
That module calls `cookies()`. Use `lib/hooks/use-user.ts` from a client component instead.

CI has a `grep` guard for the obvious form of this. The guard is not a substitute for reading
the table.

---

## Project structure

```
app/
  (marketing)/          SSG — landing, pricing, about
  (content)/            Sprint 1 — SSG + ISR. See the README in that folder
  (app)/                SSR + noindex — dashboard, notebook, settings
  (auth)/sign-in/       Static shell, client-side form
  auth/                 Route handlers: callback, confirm, sign-out
components/
  layout/               Header, footer, nav
  theme/                No-flash dark mode
  auth/                 Sign-in form, provider icons
lib/
  supabase/             client (browser) · server (cookies!) · middleware · types
  hooks/use-user.ts     Client-side session — the way content pages personalise
  routes.ts             Protected-path list, safe redirect helper
  env.ts                Lazy env access
supabase/migrations/    Schema + RLS. RLS ships in the same migration as the tables
scripts/verify-rls.ts   Adversarial RLS test
```

### Where things deliberately are not

- **Session reads in content routes.** Per-user state hydrates client-side. This is the whole
  reason content pages can be static.
- **Write access to `subscriptions`.** No RLS policy grants it. Entitlements are written only by
  the service-role key from the Stripe webhook (Sprint 3). A client that could write here could
  grant itself lifetime access.
- **Middleware on content routes.** The matcher in `middleware.ts` covers auth-relevant paths
  only. Matching content routes would add an Edge round-trip ahead of the cache on every chapter
  page — a direct TTFB and LCP cost on the pages acquisition depends on.

---

## Data model

`users` · `subscriptions` · `courses` · `chapters` (plan §11.5). `progress`, `highlights`,
`problems` and `ai_usage` arrive with the sprints that use them.

Entitlement is modelled as **"does this user have unexpired access"**, not "is there an active
Stripe subscription". Monthly is a one-time 30-day grant with no auto-renewal, so one row per
purchase and access is the union of unexpired rows. `expires_at IS NULL` means lifetime. The
`has_active_access()` SQL function is the single definition.

---

## Deploying

1. Import the repo on Vercel.
2. Set every variable from `.env.example` in **Settings → Environment Variables**, with
   `NEXT_PUBLIC_SITE_URL` as the production URL.
3. Add the production and preview URLs to Supabase → Authentication → URL Configuration.
4. Update the OAuth apps' authorised origins.

---

## Sprint 0 definition of done

| Item                                            | Status                                                         |
| ----------------------------------------------- | -------------------------------------------------------------- |
| `npm run build` passes with zero type errors    | ✅ verified                                                    |
| Route groups `(marketing)` `(content)` `(app)`  | ✅                                                             |
| Supabase wiring, typed client                   | ✅                                                             |
| First migration with RLS in the same migration  | ✅                                                             |
| Google + GitHub + magic link, protected routes  | ✅ code complete — needs your provider credentials to exercise |
| Base layout, responsive nav, no-flash dark mode | ✅                                                             |
| Landing page, SSG                               | ✅ confirmed `○ /` in the build output                         |
| CI: typecheck, lint, build                      | ✅                                                             |
| README + `.env.example`                         | ✅                                                             |
| RLS script proves cross-user reads are blocked  | ✅ written — run it against your project                       |
| Lighthouse 95+ mobile on `/`                    | ⬜ run after your first deploy                                 |

## Sprint 2 definition of done

| Item                                             | Status                                   |
| ------------------------------------------------ | ---------------------------------------- |
| `generateMetadata()` on every route              | ✅ via `lib/seo/metadata.ts`             |
| Typed JSON-LD in `components/seo/`, never inline | ✅                                       |
| `app/sitemap.ts` from real content               | ✅ 9 URLs, noindex routes excluded       |
| `app/robots.ts` with AI crawler rules            | ✅ asserted in `verify:seo`              |
| Dynamic OG images at `/api/og`, edge runtime     | ✅                                       |
| BreadcrumbList on every nested route             | ✅                                       |
| Repeatable CI check for JSON-LD + canonical      | ✅ 148 assertions, wired into CI         |
| Rich Results Test passes                         | ⬜ needs a public URL — post-deploy step |
| Lighthouse SEO 100, performance 95+ mobile       | ⬜ run after your first deploy           |

The last two need a publicly reachable URL, so they cannot be verified locally.

**Deliberate deviation:** the sprint brief asks for a sitemap split by section. This one is
organised by section but emitted as a single file. Splitting matters above ~50,000 URLs
(Google's limit); this site has nine. It would also require hand-writing a sitemap index, since
Next's `generateSitemaps()` emits the parts but not the index that points at them — one more
thing to keep correct for no benefit at this size. The section blocks in `app/sitemap.ts` map
one-to-one onto `generateSitemaps()` entries when that changes.

---

## A note on sequencing

The plan is blunt about this and it is worth repeating where it will be seen. Per §6, Sprint 0
should not start until roughly 2,000 email subscribers exist. Building is the enjoyable part and
feels like progress, which is what makes it the most comfortable way to avoid publishing weekly
and building an audience. This code will not produce customers on its own.
