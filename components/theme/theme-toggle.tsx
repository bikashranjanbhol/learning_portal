'use client';

import { useCallback, useEffect, useState } from 'react';
import { THEME_STORAGE_KEY } from './theme-script';

type Theme = 'light' | 'dark';

export function ThemeToggle() {
  // Starts undefined so the server-rendered markup and the first client render
  // agree. The real value is read after mount, which is also when the icon
  // becomes meaningful.
  const [theme, setTheme] = useState<Theme | undefined>(undefined);

  useEffect(() => {
    setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  }, []);

  const toggle = useCallback(() => {
    const next: Theme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', next === 'dark');
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // storage unavailable — the toggle still works for this page view
    }
    setTheme(next);
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      // Dimensions are fixed so the button occupies its space during hydration.
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-[var(--border)] text-[var(--fg-muted)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)]"
      aria-label={
        theme ? `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme` : 'Switch theme'
      }
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-4 dark:hidden"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="hidden size-4 dark:block"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>
  );
}
