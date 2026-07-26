import type { ReactNode } from 'react';

type Variant = 'note' | 'tip' | 'warning' | 'gotcha';

const styles: Record<Variant, { label: string; className: string; icon: ReactNode }> = {
  note: {
    label: 'Note',
    className: 'border-l-blue-500/70 bg-blue-500/5',
    icon: <circle cx="12" cy="12" r="9" />,
  },
  tip: {
    label: 'Tip',
    className: 'border-l-emerald-500/70 bg-emerald-500/5',
    icon: <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />,
  },
  warning: {
    label: 'Warning',
    className: 'border-l-amber-500/70 bg-amber-500/5',
    icon: <path d="M12 3l9.5 16.5h-19L12 3zM12 9v5M12 17.5v.5" />,
  },
  gotcha: {
    label: 'Gotcha',
    className: 'border-l-rose-500/70 bg-rose-500/5',
    icon: <path d="M12 3l9.5 16.5h-19L12 3zM12 9v5M12 17.5v.5" />,
  },
};

/**
 * Callout box.
 *
 * Server component — no interactivity, so no JavaScript ships for it.
 *
 * Usage in MDX:
 *   <Callout variant="gotcha" title="This one bites">
 *   Body text.
 *   </Callout>
 */
export function Callout({
  variant = 'note',
  title,
  children,
}: {
  variant?: Variant;
  title?: string;
  children: ReactNode;
}) {
  const style = styles[variant];

  return (
    <aside className={`my-6 rounded-r-lg border-l-4 px-5 py-4 ${style.className}`}>
      <p className="flex items-center gap-2 text-sm font-semibold">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4 shrink-0"
        >
          {style.icon}
        </svg>
        {title ?? style.label}
      </p>
      <div className="mt-2 text-sm [&>p]:my-2 [&>p:last-child]:mb-0">{children}</div>
    </aside>
  );
}
