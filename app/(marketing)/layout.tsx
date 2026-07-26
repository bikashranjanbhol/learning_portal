import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';

/**
 * Marketing shell — SSG.
 *
 * Nothing in this layout reads cookies(), headers() or searchParams, which is
 * what allows every page beneath it to be statically generated. Adding a server
 * -side session read here would silently make the entire marketing section
 * dynamic (CLAUDE.md #2).
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
