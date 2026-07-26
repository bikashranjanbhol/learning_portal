import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';

/**
 * Content shell — SSG + ISR.
 *
 * Nothing in this layout may read cookies(), headers() or searchParams. One
 * such call here would make every chapter and blog post render per request,
 * with no build error to tell you (CLAUDE.md #2).
 *
 * `npm run verify:static` guards the common form of this; the route table from
 * `npm run build` is the real check.
 */
export default function ContentLayout({ children }: { children: React.ReactNode }) {
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
