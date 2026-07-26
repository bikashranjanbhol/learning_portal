# Implementation prompts

Copy-paste prompts for building the platform with an agentic coding tool
(Claude Code, Cursor, Windsurf, or similar).

---

## How to use these

1. Create an empty repo and drop **`CLAUDE.md`** at its root. That file holds the constraints
   that must never be violated — the tool reads it on every request, so you don't re-paste them.
2. Put **`learning-platform-business-plan.md`** in the repo too, at `/docs/plan.md`.
3. Run the **kickoff prompt** once.
4. Then run **one sprint prompt at a time.** Review and commit between sprints.

**Do not paste all six sprints at once.** Agentic tools degrade badly on multi-day scope in a
single request — they stub things, drift from constraints, and produce code that looks complete
but isn't. One sprint per session, reviewed before the next, is meaningfully more reliable.

*Using a plain chat LLM instead (no file access)?* These still work — add
`Output complete files with their full paths. Do not abbreviate with "// ... rest unchanged".`
to each prompt, and paste `CLAUDE.md` at the top of every new conversation.

---

## Kickoff prompt — run once

```
I'm building an interview-prep learning platform (system design, low-level design, DSA)
as a solo developer with roughly 4-6 hours per week. The full business and technical plan
is at /docs/plan.md, and the hard technical constraints are in /CLAUDE.md at the repo root.

Read both files now, then before writing any code:

1. Summarise back to me, in under 200 words, what you understand we're building and which
   three constraints you think are most likely to be violated accidentally during the build.

2. List any decisions in the plan you disagree with, or that you think are wrong or risky
   for a solo developer at zero traffic. Be direct — I would rather hear objections now
   than discover them in month four. If you think something in the plan is over-engineered,
   say so.

3. Ask me any questions you need answered before starting Sprint 0.

Do not write code yet. I want to agree on the shape of this first.
```

---

## Sprint 0 — Foundation

```
Let's build Sprint 0: the foundation. Scope is strictly limited to what's listed below —
do not build ahead into content rendering, payments, or the paywall.

Deliverables:
- Next.js 15 App Router project, TypeScript strict mode, Tailwind, ESLint + Prettier
- Route group structure per /CLAUDE.md: (marketing), (content), (app)
- Supabase project wiring: client and server helpers, typed database client
- First migration: users, subscriptions, courses, chapters tables per the data model
  in the plan. RLS enabled on every user-scoped table in this same migration.
- Auth: Google OAuth, GitHub OAuth, and email magic link. Sign-in, sign-out,
  protected-route middleware.
- Base layout: header, footer, responsive nav, dark mode with no flash on load
- A placeholder landing page at / (SSG)
- GitHub Actions CI: typecheck, lint, build
- README with local setup steps and a .env.example listing every required variable

Definition of done:
- npm run build passes with zero type errors
- I can sign in with all three methods and see my session persist across a refresh
- The RLS policies actually work — write a script under /scripts that attempts to read
  another user's rows with their JWT and confirms it's blocked. I want to see it fail correctly.
- Lighthouse on / scores 95+ on mobile

Work in small commits, one concern each. Stop and ask if you hit a decision
that isn't covered by the plan or CLAUDE.md.
```

---

## Sprint 1 — Content pipeline

```
Sprint 1: the MDX content pipeline. Scope is content rendering only — no paywall logic yet,
render everything as free for now.

Deliverables:
- MDX loading from /content, with frontmatter: title, slug, description, order,
  isFree, readingTime, publishedAt, updatedAt
- Route /learn/[course]/[chapter] using generateStaticParams + revalidate 3600
- Route /blog/[slug], same approach
- MDX components: syntax-highlighted code blocks with copy button, callouts,
  images via next/image, tables
- Auto-generated table of contents with scroll-spy
- Previous/next chapter navigation, and a course sidebar showing chapter order
- Reading progress bar
- Three real sample chapters in /content so we can see it working end to end

Constraints I want you to be careful about here, from CLAUDE.md:
- No cookies() or headers() anywhere in these routes. If you need per-user state
  (progress ticks, "continue reading"), that's a client component that hydrates after load.
- Verify statically generated output: after build, confirm these routes appear as
  static/ISR in the build output, not as dynamic. Show me that output.

Definition of done: build output confirms SSG for all content routes, and
View Source on a chapter page shows the full chapter text in the initial HTML.
```

---

## Sprint 2 — SEO and AEO layer

```
Sprint 2: the SEO and AI-answer-engine layer. This sprint is the acquisition strategy
for the entire business, so I want it done properly rather than quickly.

Deliverables:
- generateMetadata() on every route: title, description, canonical, OG, Twitter card
- Typed JSON-LD components in components/seo/: Organization, Person, Course,
  CourseInstance, TechArticle, FAQPage, BreadcrumbList, SoftwareSourceCode.
  Typed builders, not hand-written inline JSON.
- app/sitemap.ts generated from actual content, split by section
- app/robots.ts with the AI crawler rules from CLAUDE.md: allow GPTBot, ClaudeBot
  and PerplexityBot on free content, disallow on premium paths and /api, /dashboard, /settings
- Dynamic OG images at /api/og using next/og, edge runtime, with title/subtitle/eyebrow params
- BreadcrumbList on every nested route
- Core Web Vitals: audit and fix. Budget is LCP < 2.0s, INP < 200ms, CLS < 0.1 on mobile.

Also add a check I can run repeatedly: a script under /scripts that fetches a list of
routes and asserts each returns valid JSON-LD and a canonical tag. I want this runnable
in CI so SEO regressions fail the build rather than being discovered months later in
Search Console.

Definition of done: Google Rich Results Test passes for a chapter page, a course page,
and the FAQ page. Lighthouse SEO 100, Performance 95+ on mobile.
```

---

## Sprint 3 — Monetisation and paywall

```
Sprint 3: payments and the paywall. Read the paywall section of CLAUDE.md carefully
before starting — a mistake here can get the site de-indexed by Google, so it's the
highest-risk area in the codebase.

Deliverables:
- Stripe products and checkout for three tiers: $29 monthly (ONE-TIME, not recurring),
  $79 annual, $179 lifetime
- Webhook handler: signature-verified, idempotent, updates the subscriptions table
- Entitlement logic modelled as "does this user have unexpired access", NOT
  "is there an active Stripe subscription". Monthly is a one-time 30-day grant.
- A <Gate> component that wraps premium content in a div with class exactly "premium-content"
- TechArticle JSON-LD emitting isAccessibleForFree correctly: false on the article AND
  on a nested hasPart WebPageElement with cssSelector ".premium-content" for gated chapters;
  true for free chapters
- Free preview above the gate: intro, headings, first example
- Upgrade page, post-purchase success flow, Stripe customer portal link
- PPP discount: IP-based region detection, 50-60% off for India, Brazil, SEA

Critical, and I want you to confirm you've followed these:
- No user-agent sniffing for Googlebot anywhere. Gate on session state only.
- The cssSelector string in the JSON-LD and the className in the DOM must match exactly.
  Derive both from a single shared constant so they cannot drift apart.

Definition of done:
- Test-mode purchase on each tier grants correct access
- Refund and webhook replay both handled correctly without double-granting
- A gated chapter validates in Rich Results Test with the paywall markup recognised
- View Source on a gated chapter as a logged-out user shows the free preview,
  and the premium-content div is present and correctly marked
```

---

## Sprint 4 — Engagement

```
Sprint 4: retention features. These are what make someone renew, so favour reliability
over cleverness.

Deliverables:
- Progress tracking: mark chapters and problems complete, with a course completion indicator
- Text highlighting with multiple colours, persisted per user
- Inline notes attached to highlights
- A notebook view collecting all highlights and notes, searchable and exportable to markdown
- Starred/bookmarked items
- Site-wide search using Postgres full-text search — not Algolia, not a vector DB

All of this is per-user state, so per CLAUDE.md it lives in client components that hydrate
after load. The content pages themselves must stay statically generated — confirm in the
build output that adding these features didn't flip any content route to dynamic. That's
the specific regression I'm worried about in this sprint.

Definition of done: build output still shows SSG/ISR for all content routes,
RLS verified on the new tables, and Lighthouse performance hasn't regressed below 95.
```

---

## Sprint 5 — Differentiators

```
Sprint 5: the features that actually differentiate this from a blog.

Deliverables:

1. An animation framework — this is the important part. I need a reusable set of primitives
   (array visualiser, graph/tree visualiser, timeline/sequence stepper, playback controls
   with step-forward/back and speed) that new animations are composed from in an hour or two.
   I do not want 200 bespoke one-off animations; that's what kills content velocity.
   Build the framework first, then 8-10 animations using it as proof it generalises.

2. AI tutor: streaming responses, paid users only, rate-limited per user and per IP,
   hard monthly spend ceiling, every call logged to ai_usage. Supports "explain this
   selection", "summarise this chapter", "quiz me on this".

Per CLAUDE.md: animations must load via dynamic import with ssr: false, mount on
IntersectionObserver, and reserve dimensions to avoid layout shift. An animation-heavy
page that fails INP will rank worse than a plain-text competitor, which defeats the point.

Definition of done: a chapter page with three animations still hits LCP < 2.0s,
INP < 200ms, CLS < 0.1 on mobile. The AI endpoint refuses unauthenticated and
free-tier requests, and stops serving when the monthly ceiling is hit.
```

---

## Prompts worth running periodically

**Before every launch or major merge:**

```
Run through the pre-launch checklist in /docs/plan.md section 11.8 against the current
codebase. For each item, tell me pass, fail, or not-yet-implemented, with the file and
line where you verified it. Don't fix anything yet — I want the full picture first.
```

**When something feels slow:**

```
Audit Core Web Vitals on /learn/[course]/[chapter] against our budget in CLAUDE.md
(LCP < 2.0s, INP < 200ms, CLS < 0.1 mobile). Identify the three largest contributors
and propose fixes ranked by impact-to-effort. Don't implement yet.
```

**Monthly, to catch drift:**

```
Review the codebase against the hard constraints in /CLAUDE.md. List every violation
you find, with file and line. Pay particular attention to: content routes that have
become dynamic, cookies()/headers() calls inside content pages, and any drift between
the paywall cssSelector constant and the DOM.
```

---

## One thing worth saying plainly

These prompts will get you a working platform. They will not get you customers.

The plan (§4, §5) is direct about this: the most likely outcome is that you stop within a
year, and the cause is almost never the code. Building is the enjoyable part and it will
feel like progress, which is exactly what makes it the most comfortable way to avoid the
harder work of publishing weekly and building an audience.

Per the plan, Sprint 0 shouldn't start until you're at ~2,000 email subscribers.
If you're not there yet, the prompt you actually want is a content plan, not this one —
happy to write that instead.
