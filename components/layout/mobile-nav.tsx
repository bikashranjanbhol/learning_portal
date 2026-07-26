'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { site } from '@/lib/site';
import { AuthNav } from './auth-nav';

export function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? 'Close menu' : 'Open menu'}
        className="inline-flex size-9 items-center justify-center rounded-md border border-[var(--border)] text-[var(--fg-muted)]"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          className="size-4"
        >
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      {open ? (
        <div
          id="mobile-menu"
          // Absolutely positioned so opening the menu does not push page
          // content down — an in-flow panel here is a CLS hit on mobile,
          // which is the device class the performance budget is written for.
          className="absolute inset-x-0 top-16 border-b border-[var(--border)] bg-[var(--bg)] px-4 py-3 shadow-lg"
        >
          <ul className="flex flex-col gap-1">
            {site.nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-2.5 text-sm font-medium text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-2 border-t border-[var(--border)] pt-2">
            <AuthNav />
          </div>
        </div>
      ) : null}
    </div>
  );
}
