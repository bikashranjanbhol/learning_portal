import Link from 'next/link';
import { site } from '@/lib/site';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { AuthNav } from './auth-nav';
import { MobileNav } from './mobile-nav';

/**
 * Server component. Renders identically for every visitor, which is what keeps
 * the pages that include it statically generated. The only per-user parts —
 * <AuthNav> and <ThemeToggle> — are client components that hydrate after load.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/85 backdrop-blur">
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6"
      >
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-semibold tracking-tight"
        >
          <span
            aria-hidden="true"
            className="grid size-7 place-items-center rounded-md bg-[var(--accent)] text-xs font-bold text-[var(--accent-fg)]"
          >
            IP
          </span>
          <span>{site.name}</span>
        </Link>

        <ul className="hidden flex-1 items-center gap-1 md:flex">
          {site.nav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)]"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <ThemeToggle />
          <div className="hidden md:block">
            <AuthNav />
          </div>
          <MobileNav />
        </div>
      </nav>
    </header>
  );
}
