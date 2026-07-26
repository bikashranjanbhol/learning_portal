/**
 * Blocking inline script that applies the theme before first paint.
 *
 * This has to be synchronous and inline in <head>. Anything async — a
 * useEffect, a deferred script, a client component — paints the default theme
 * first and then corrects it, which is the white flash. It is also a layout
 * shift against the CLS budget, not just an aesthetic problem.
 *
 * Kept tiny (<500 bytes) because it blocks parsing by design.
 */

export const THEME_STORAGE_KEY = 'theme';

const script = `
(function(){
  try {
    var s = localStorage.getItem('${THEME_STORAGE_KEY}');
    var m = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = s === 'dark' || (s !== 'light' && m);
    document.documentElement.classList.toggle('dark', dark);
    /* Paywall: last known entitlement, so a subscriber does not watch the gate
       flash shut and reopen. Cosmetic only — the authoritative check runs after
       hydration and corrects this. Spoofing it reveals nothing, because under
       the declared-paywall strategy the text is already in the HTML. */
    if (localStorage.getItem('entitled') === '1') {
      document.documentElement.dataset.entitled = 'true';
    }
  } catch (e) {
    /* private mode or storage disabled — fall through to the light default */
  }
})();
`
  .replace(/\s+/g, ' ')
  .trim();

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} suppressHydrationWarning />;
}
