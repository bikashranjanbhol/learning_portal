import Link from 'next/link';
import { site } from '@/lib/site';

const columns: Array<{ title: string; links: ReadonlyArray<{ href: string; label: string }> }> =
  [
    { title: 'Product', links: site.footer.product },
    { title: 'Company', links: site.footer.company },
  ];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-[var(--border)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-1">
          <p className="font-semibold tracking-tight">{site.name}</p>
          <p className="mt-2 text-sm text-balance text-[var(--fg-muted)]">{site.tagline}</p>
        </div>

        {columns.map((column) => (
          <div key={column.title}>
            <h2 className="text-sm font-semibold">{column.title}</h2>
            <ul className="mt-3 space-y-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-[var(--border)]">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-[var(--fg-muted)] sm:px-6">
          © {new Date().getFullYear()} {site.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
