/**
 * The single source of truth for the paywall selector.
 *
 * CLAUDE.md #5: the `cssSelector` in the TechArticle JSON-LD and the className
 * on the gated <div> must match EXACTLY. A mismatch is read by Google as
 * cloaking rather than as a bug, and the consequence is de-indexing, not a
 * warning.
 *
 * Both values are derived from one constant here so they cannot drift. Nothing
 * anywhere should hard-code the string "premium-content" — import from this
 * file instead. `npm run verify:seo` asserts that the selector in the emitted
 * JSON-LD actually matches an element in the rendered HTML.
 *
 * Sprint 3 adds the <Gate> component and entitlement checks. This constant
 * exists now because the JSON-LD that references it is built in Sprint 2, and
 * defining it in two places even briefly is exactly how the drift starts.
 */

export const PREMIUM_CONTENT_CLASS = 'premium-content';

export const PREMIUM_CONTENT_SELECTOR = `.${PREMIUM_CONTENT_CLASS}` as const;

/**
 * Whether the paywall is actually enforced. **Sprint 3 flips this to true.**
 *
 * Until then every chapter renders in full, so every chapter genuinely IS free
 * to read — and the structured data has to say so. Emitting
 * `isAccessibleForFree: false` with a `hasPart` selector while the content is
 * in fact fully readable would be a misrepresentation in the opposite
 * direction from the usual one, and it is the same underlying offence: telling
 * Google something that does not match what a visitor gets.
 *
 * The `.premium-content` wrapper is rendered on gated chapters from now on
 * regardless, so the DOM and the selector constant are already in agreement.
 * Flipping this flag then changes the JSON-LD and the gating together, which is
 * the only way they cannot drift apart.
 */
export const PAYWALL_ACTIVE = true;

/**
 * Which of the two Google-sanctioned paywall strategies to use (plan §11.2).
 *
 * 'declared' — Option B, the plan's recommendation. The full chapter is in the
 *   served HTML for everyone, the gated region is declared in the TechArticle
 *   JSON-LD, and the UI hides it from people who have not paid. Google indexes
 *   the whole text, so deep topics can rank.
 *
 *   The consequence, stated plainly: **the premium text is readable in view
 *   source.** That is inherent to the strategy, not a bug in this
 *   implementation, and it is the price of having the full text indexed. The
 *   paywall is a UX and social boundary, not a technical one.
 *
 * 'truncated' — Option A. Only the free preview is ever rendered; the premium
 *   MDX never reaches the client. Nothing leaks, and only the preview is
 *   indexed, so deep pages rank on their preview alone.
 *
 * Both are legitimate. Switching is a one-line change here — the chapter page
 * already splits preview from body — so this decision is reversible if the
 * leakage turns out to matter more than the ranking.
 *
 * What is NOT allowed under either strategy: serving different content to
 * Googlebot than to people. That is cloaking, and it carries a manual action
 * (CLAUDE.md #6).
 */
export const PAYWALL_STRATEGY: 'declared' | 'truncated' = 'declared';

/**
 * The value the TechArticle should carry for a given chapter.
 *
 * Single source of truth — the page and `scripts/check-seo.ts` both call this,
 * so the test cannot disagree with the implementation about what is expected.
 */
export function isAccessibleForFree(chapterIsFree: boolean): boolean {
  return chapterIsFree || !PAYWALL_ACTIVE;
}
