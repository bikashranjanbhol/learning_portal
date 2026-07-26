/**
 * SEO regression check.
 *
 * Sprint 2 brief: "a script I can run repeatedly that fetches a list of routes
 * and asserts each returns valid JSON-LD and a canonical tag… runnable in CI so
 * SEO regressions fail the build rather than being discovered months later in
 * Search Console."
 *
 * That last clause is the point. Every failure this catches is silent: a
 * dropped canonical, a malformed schema, a paywall selector that no longer
 * matches the DOM. Nothing errors at build time and nothing looks wrong in a
 * browser. The only other feedback loop is ranking damage months later.
 *
 * Usage — against a running server:
 *   npm run build && npm run start &
 *   npm run verify:seo
 *   BASE_URL=https://your-site.com npm run verify:seo
 */

import {
  PREMIUM_CONTENT_CLASS,
  PREMIUM_CONTENT_SELECTOR,
  isAccessibleForFree,
} from '../lib/paywall';

const BASE_URL = (process.env.BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

let failures = 0;
let checks = 0;
const failedRoutes = new Set<string>();

function pass(route: string, label: string) {
  checks += 1;
  console.log(`    \x1b[32m✓\x1b[0m ${label}`);
  void route;
}

function fail(route: string, label: string, detail: string) {
  checks += 1;
  failures += 1;
  failedRoutes.add(route);
  console.log(`    \x1b[31m✗\x1b[0m ${label}`);
  console.log(`      ${detail}`);
}

function assert(route: string, condition: boolean, label: string, detail = '') {
  if (condition) pass(route, label);
  else fail(route, label, detail);
}

// ---------------------------------------------------------------------------
// Extraction
//
// Regex rather than a DOM parser: this runs against the server's HTML output,
// and adding a parser dependency to check ~10 tags is not worth it. The
// patterns are deliberately narrow so they fail loudly rather than matching
// something unintended.
// ---------------------------------------------------------------------------

function extractJsonLd(html: string): unknown[] {
  const blocks = [
    ...html.matchAll(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ];

  return blocks.map((match) => {
    const raw = match[1] ?? '';
    // Undo the `<` escaping applied in components/seo/json-ld.tsx.
    return JSON.parse(raw.replace(/\\u003c/g, '<')) as unknown;
  });
}

function extractTag(html: string, pattern: RegExp): string | null {
  const match = pattern.exec(html);
  return match?.[1] ?? null;
}

const CANONICAL = /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i;
const TITLE = /<title[^>]*>([\s\S]*?)<\/title>/i;
const DESCRIPTION = /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i;
const OG_TITLE = /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i;
const OG_IMAGE = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)["']/i;
const TWITTER_CARD = /<meta[^>]+name=["']twitter:card["'][^>]+content=["']([^"']*)["']/i;
const ROBOTS = /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i;

/** Flatten @graph documents so a type can be looked up regardless of nesting. */
function collectNodes(documents: unknown[]): Record<string, unknown>[] {
  const nodes: Record<string, unknown>[] = [];
  for (const doc of documents) {
    if (typeof doc !== 'object' || doc === null) continue;
    const record = doc as Record<string, unknown>;
    const inner = record['@graph'];
    if (Array.isArray(inner)) {
      for (const node of inner) {
        if (typeof node === 'object' && node !== null) {
          nodes.push(node as Record<string, unknown>);
        }
      }
    } else {
      nodes.push(record);
    }
  }
  return nodes;
}

function findByType(nodes: Record<string, unknown>[], type: string) {
  return nodes.find((node) => node['@type'] === type);
}

// ---------------------------------------------------------------------------
// Route expectations
// ---------------------------------------------------------------------------

type RouteSpec = {
  path: string;
  /** schema.org @type values that must be present. */
  requiredTypes?: string[];
  requireCanonical?: boolean;
  /** Auth and user-scoped pages must be excluded from the index. */
  expectNoindex?: boolean;
  /**
   * Chapter pages: the chapter's own `isFree` frontmatter value.
   *
   * The expected JSON-LD flag is derived from it via the same
   * isAccessibleForFree() the page uses, rather than hard-coded here. A test
   * that restates the rule can disagree with the implementation; one that
   * calls it cannot.
   */
  chapterIsFree?: boolean;
  /** Gated chapters must carry the wrapper the cssSelector names. */
  expectPremiumWrapper?: boolean;
};

const ROUTES: RouteSpec[] = [
  { path: '/', requiredTypes: ['Organization', 'WebSite', 'Person'] },
  { path: '/courses' },
  { path: '/courses/system-design-beginner', requiredTypes: ['Course', 'BreadcrumbList'] },
  {
    path: '/learn/system-design-beginner/introduction-to-system-design',
    requiredTypes: ['TechArticle', 'BreadcrumbList'],
    chapterIsFree: true, // isFree: true in frontmatter
    expectPremiumWrapper: false,
  },
  {
    path: '/learn/system-design/consistent-hashing',
    requiredTypes: ['TechArticle', 'BreadcrumbList'],
    chapterIsFree: false, // isFree: false in frontmatter
    expectPremiumWrapper: true,
  },
  { path: '/blog' },
  {
    path: '/blog/why-organic-search-still-matters',
    requiredTypes: ['TechArticle', 'BreadcrumbList'],
    chapterIsFree: true, // blog posts are always free
    expectPremiumWrapper: false,
  },
  { path: '/pricing', requiredTypes: ['FAQPage'] },
  { path: '/sign-in', expectNoindex: true, requireCanonical: false },
];

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

async function checkRoute(spec: RouteSpec) {
  const url = `${BASE_URL}${spec.path}`;
  console.log(`\n  ${spec.path}`);

  const response = await fetch(url, { redirect: 'manual' });

  if (response.status !== 200) {
    fail(spec.path, 'responds 200', `got ${response.status}`);
    return;
  }

  const html = await response.text();

  // --- Metadata (CLAUDE.md #9) ---------------------------------------------

  const title = extractTag(html, TITLE);
  assert(spec.path, Boolean(title && title.trim().length > 0), 'has a <title>');

  const description = extractTag(html, DESCRIPTION);
  assert(
    spec.path,
    Boolean(description && description.length >= 50),
    'has a meta description of usable length',
    `got ${description ? `${description.length} chars` : 'none'} — under 50 gets rewritten by Google`,
  );

  if (spec.requireCanonical !== false) {
    const canonical = extractTag(html, CANONICAL);
    assert(spec.path, canonical !== null, 'has a canonical link');

    if (canonical) {
      assert(
        spec.path,
        canonical.startsWith('http'),
        'canonical is absolute',
        `got "${canonical}" — relative canonicals are ignored`,
      );
      const expected = `${BASE_URL}${spec.path === '/' ? '/' : spec.path}`;
      assert(
        spec.path,
        canonical.replace(/\/$/, '') === expected.replace(/\/$/, ''),
        'canonical points at this page',
        `expected ${expected}, got ${canonical}`,
      );
    }
  }

  assert(spec.path, extractTag(html, OG_TITLE) !== null, 'has og:title');
  assert(spec.path, extractTag(html, TWITTER_CARD) !== null, 'has twitter:card');

  const ogImage = extractTag(html, OG_IMAGE);
  assert(spec.path, ogImage !== null, 'has og:image');

  if (spec.expectNoindex) {
    const robots = extractTag(html, ROBOTS);
    assert(
      spec.path,
      Boolean(robots?.includes('noindex')),
      'is noindex',
      `robots meta was "${robots ?? 'absent'}"`,
    );
  }

  // --- JSON-LD (CLAUDE.md #13) ---------------------------------------------

  let documents: unknown[] = [];
  try {
    documents = extractJsonLd(html);
    assert(spec.path, documents.length > 0, 'emits JSON-LD');
  } catch (error) {
    fail(spec.path, 'JSON-LD parses', `invalid JSON: ${(error as Error).message}`);
    return;
  }

  const nodes = collectNodes(documents);

  for (const node of nodes) {
    const type = String(node['@type'] ?? 'unknown');
    assert(
      spec.path,
      typeof node['@type'] === 'string',
      `node has an @type (${type})`,
      'a node without @type is ignored by every consumer',
    );
  }

  for (const type of spec.requiredTypes ?? []) {
    assert(
      spec.path,
      findByType(nodes, type) !== undefined,
      `has ${type} schema`,
      `types present: ${nodes.map((n) => String(n['@type'])).join(', ') || 'none'}`,
    );
  }

  // --- Paywall (CLAUDE.md #5, #7) — the highest-risk assertion in this file --

  if (spec.chapterIsFree !== undefined) {
    const article = findByType(nodes, 'TechArticle');
    const expected = isAccessibleForFree(spec.chapterIsFree);

    if (!article) {
      fail(spec.path, 'has TechArticle to check paywall flags on', 'no TechArticle node');
    } else {
      assert(
        spec.path,
        article['isAccessibleForFree'] === expected,
        `isAccessibleForFree is ${expected}`,
        `got ${JSON.stringify(article['isAccessibleForFree'])} — this must describe what a visitor actually gets (CLAUDE.md #7)`,
      );

      const hasPart = article['hasPart'] as Record<string, unknown> | undefined;

      if (expected) {
        assert(
          spec.path,
          hasPart === undefined,
          'freely readable content declares no paywalled part',
          'claiming a paywalled section on a page that renders in full is a cloaking signal',
        );
      } else {
        assert(spec.path, hasPart !== undefined, 'gated content declares a hasPart element');

        if (hasPart) {
          const selector = hasPart['cssSelector'];

          assert(
            spec.path,
            typeof selector === 'string' && selector.length > 0,
            'hasPart declares a cssSelector',
          );

          // ---------------------------------------------------------------
          // The assertion this whole script exists for (CLAUDE.md #5).
          //
          // It compares the selector STRING THAT WAS ACTUALLY SERVED against
          // the HTML THAT WAS ACTUALLY SERVED. It deliberately does not
          // compare against PREMIUM_CONTENT_SELECTOR: checking the emitted
          // value against the same constant the page rendered it from is
          // tautological — rename the constant and both sides move together
          // while the DOM silently disagrees. That is the exact drift this is
          // meant to catch, and Google reads it as cloaking, not as a bug.
          // ---------------------------------------------------------------
          if (typeof selector === 'string') {
            assert(
              spec.path,
              selectorMatchesDom(selector, html),
              `cssSelector "${selector}" matches an element in the served HTML`,
              'the JSON-LD claims a paywalled element that is not on the page (CLAUDE.md #5) — this is a de-indexing risk, not a warning',
            );

            // Secondary: flag a literal that bypassed the shared constant.
            if (selector !== PREMIUM_CONTENT_SELECTOR) {
              fail(
                spec.path,
                'cssSelector comes from lib/paywall.ts',
                `served "${selector}" but the constant is "${PREMIUM_CONTENT_SELECTOR}" — one of them is hard-coded`,
              );
            } else {
              pass(spec.path, 'cssSelector comes from lib/paywall.ts');
            }
          }

          assert(
            spec.path,
            hasPart['isAccessibleForFree'] === false,
            'hasPart is marked not free',
          );
        }
      }
    }
  }

  // Whether the gated wrapper is present at all. Checked against the class
  // constant, which is fine here — this asks "did the page render a wrapper",
  // a different question from "does the emitted selector match the DOM".
  if (spec.expectPremiumWrapper !== undefined) {
    const present = hasClassInDom(PREMIUM_CONTENT_CLASS, html);
    assert(
      spec.path,
      present === spec.expectPremiumWrapper,
      spec.expectPremiumWrapper
        ? `DOM contains the .${PREMIUM_CONTENT_CLASS} wrapper`
        : `DOM has no .${PREMIUM_CONTENT_CLASS} wrapper (content is free)`,
      spec.expectPremiumWrapper
        ? 'the gated wrapper is missing'
        : 'free content should not be wrapped as premium',
    );

    if (spec.expectPremiumWrapper && present) {
      // CLAUDE.md #8: a genuine free preview must sit OUTSIDE the gate. A page
      // that is 100% gated ranks poorly however correct the markup is.
      const gateIndex = html.search(
        new RegExp(`class=["'][^"']*\\b${PREMIUM_CONTENT_CLASS}\\b`),
      );
      const articleStart = html.indexOf('<article');
      const previewChars = gateIndex - articleStart;

      assert(
        spec.path,
        articleStart !== -1 && previewChars > 1500,
        'a substantial free preview renders before the gate',
        `only ~${Math.max(0, previewChars)} chars of markup precede .${PREMIUM_CONTENT_CLASS}`,
      );

      // The gate must ship locked. If the server rendered it open, the paywall
      // depends entirely on JavaScript running, and a crawler or a reader with
      // JS disabled gets the whole chapter with no gate at all.
      assert(
        spec.path,
        /class=["'][^"']*\bpremium-content\b[^"']*["'][^>]*data-gated=["']true["']/.test(
          html,
        ) || /data-gated=["']true["'][^>]*class=["'][^"']*\bpremium-content\b/.test(html),
        'the gate is server-rendered in the locked state',
        'data-gated="true" was not found on the wrapper — the paywall would be open by default',
      );
    }
  }

  // No user-agent sniffing (CLAUDE.md #6). This cannot prove the absence of
  // cloaking, but it does catch the obvious form: a response that varies by UA
  // will normally advertise that in Vary.
  const vary = response.headers.get('vary') ?? '';
  assert(
    spec.path,
    !/user-agent/i.test(vary),
    'response does not Vary on User-Agent',
    `Vary was "${vary}" — serving different content to crawlers is cloaking`,
  );
}

/** Escape a string for safe inclusion in a RegExp. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasClassInDom(className: string, html: string): boolean {
  return new RegExp(`class=["'][^"']*\\b${escapeRegExp(className)}\\b`).test(html);
}

/**
 * Does a CSS selector match something in the served HTML?
 *
 * Handles the forms a paywall selector realistically takes. Anything more
 * exotic returns false rather than guessing — a selector this script cannot
 * verify is one nobody is verifying, which is worse than a failing check.
 */
function selectorMatchesDom(selector: string, html: string): boolean {
  const trimmed = selector.trim();

  if (trimmed.startsWith('.')) {
    return hasClassInDom(trimmed.slice(1), html);
  }

  if (trimmed.startsWith('#')) {
    return new RegExp(`id=["']${escapeRegExp(trimmed.slice(1))}["']`).test(html);
  }

  // e.g. "div.premium-content"
  const tagWithClass = /^([a-z]+)\.([\w-]+)$/i.exec(trimmed);
  if (tagWithClass?.[2]) {
    return hasClassInDom(tagWithClass[2], html);
  }

  return false;
}

async function checkSitemapAndRobots() {
  console.log('\n  /sitemap.xml and /robots.txt');

  const sitemap = await fetch(`${BASE_URL}/sitemap.xml`);
  assert('/sitemap.xml', sitemap.status === 200, 'sitemap responds 200');

  if (sitemap.status === 200) {
    const xml = await sitemap.text();
    assert('/sitemap.xml', xml.includes('<urlset'), 'sitemap is a urlset');
    const count = [...xml.matchAll(/<loc>/g)].length;
    assert('/sitemap.xml', count > 0, `sitemap lists URLs (${count})`);
    assert(
      '/sitemap.xml',
      !xml.includes('/sign-in') && !xml.includes('/dashboard'),
      'sitemap excludes noindex routes',
      'listing a noindex URL produces a Search Console warning',
    );
  }

  const robots = await fetch(`${BASE_URL}/robots.txt`);
  assert('/robots.txt', robots.status === 200, 'robots responds 200');

  if (robots.status === 200) {
    const text = await robots.text();
    assert('/robots.txt', text.includes('Sitemap:'), 'robots points at the sitemap');

    // CLAUDE.md #11
    for (const bot of ['GPTBot', 'ClaudeBot', 'PerplexityBot']) {
      assert('/robots.txt', text.includes(bot), `robots has a rule for ${bot}`);
    }
    assert(
      '/robots.txt',
      /Disallow:\s*\/learn\//.test(text),
      'AI crawlers are disallowed on premium /learn/ paths',
      'allowing them there gives away the product (CLAUDE.md #11)',
    );
  }
}

async function checkOgImage() {
  console.log('\n  /api/og');
  const response = await fetch(`${BASE_URL}/api/og?title=Test&subtitle=Sub&eyebrow=Eyebrow`);
  assert('/api/og', response.status === 200, 'OG image responds 200');
  assert(
    '/api/og',
    (response.headers.get('content-type') ?? '').includes('image/'),
    'OG image returns an image',
    `content-type was ${response.headers.get('content-type')}`,
  );
}

// ---------------------------------------------------------------------------

async function main() {
  console.log(`\nSEO check — ${BASE_URL}`);

  try {
    await fetch(BASE_URL);
  } catch {
    console.error(`\n  Cannot reach ${BASE_URL}. Start the server first:\n`);
    console.error('    npm run build && npm run start\n');
    process.exit(1);
  }

  for (const spec of ROUTES) {
    await checkRoute(spec);
  }
  await checkSitemapAndRobots();
  await checkOgImage();

  console.log(`\n  ${checks - failures}/${checks} checks passed`);

  if (failures > 0) {
    console.error(
      `\n\x1b[31m  SEO check FAILED — ${failures} problem(s) in: ${[...failedRoutes].join(', ')}\x1b[0m\n`,
    );
    process.exit(1);
  }
  console.log('\x1b[32m  SEO verified.\x1b[0m\n');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
