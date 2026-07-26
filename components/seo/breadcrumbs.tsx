import Link from 'next/link';
import { breadcrumbs as buildBreadcrumbs, graph } from '@/lib/seo/schema';
import { JsonLd } from './json-ld';

export type Crumb = { name: string; pathname?: string };

/**
 * Visible breadcrumb trail plus its BreadcrumbList JSON-LD, from one input.
 *
 * Emitting the markup and the visible trail separately is how they drift — the
 * structured data ends up describing a path the page does not actually show,
 * which Google flags. Here they cannot disagree.
 */
export function Breadcrumbs({ trail, className }: { trail: Crumb[]; className?: string }) {
  const last = trail[trail.length - 1];

  return (
    <>
      <JsonLd data={graph(buildBreadcrumbs(trail))} />

      <nav aria-label="Breadcrumb" className={className ?? 'text-xs text-[var(--fg-muted)]'}>
        <ol className="flex flex-wrap items-center gap-1.5">
          {trail.map((crumb, index) => {
            const isLast = index === trail.length - 1;
            return (
              <li key={`${crumb.name}-${index}`} className="flex items-center gap-1.5">
                {crumb.pathname && !isLast ? (
                  <Link href={crumb.pathname} className="hover:text-[var(--fg)]">
                    {crumb.name}
                  </Link>
                ) : (
                  <span aria-current={isLast ? 'page' : undefined}>{crumb.name}</span>
                )}
                {!isLast ? <span aria-hidden="true">/</span> : null}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Keeps the trail meaningful to screen readers when it is visually truncated. */}
      <span className="sr-only">Current page: {last?.name}</span>
    </>
  );
}
