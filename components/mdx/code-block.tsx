'use client';

import { useCallback, useRef, useState, type ReactNode } from 'react';

const LANGUAGE_NAMES: Record<string, string> = {
  bash: 'Bash',
  css: 'CSS',
  html: 'HTML',
  js: 'JavaScript',
  javascript: 'JavaScript',
  json: 'JSON',
  jsx: 'JSX',
  md: 'Markdown',
  plaintext: 'Text',
  py: 'Python',
  python: 'Python',
  sh: 'Shell',
  sql: 'SQL',
  ts: 'TypeScript',
  tsx: 'TSX',
  yaml: 'YAML',
  yml: 'YAML',
};

/**
 * Copy-to-clipboard wrapper around a Shiki-highlighted <pre>.
 *
 * The highlighting itself happens at build time via rehype-pretty-code, so the
 * only JavaScript shipped for a code block is this button's click handler. That
 * matters: a chapter page can carry twenty code blocks, and a client-side
 * highlighter would run twenty times during hydration, straight into the INP
 * budget.
 */
export function CodeBlock({
  children,
  language,
  className,
  ...props
}: {
  children?: ReactNode;
  language?: string;
} & React.HTMLAttributes<HTMLPreElement>) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);
  const languageName = language ? (LANGUAGE_NAMES[language.toLowerCase()] ?? language) : 'Code';

  const copy = useCallback(async () => {
    const text = preRef.current?.textContent ?? '';
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API needs a secure context; on http:// this throws. Silently
      // doing nothing is better than an error toast the reader cannot act on.
    }
  }, []);

  return (
    <div className="group my-7 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] shadow-sm">
      <div className="flex h-11 items-center justify-between border-b border-[var(--border)] bg-[var(--bg)] px-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-red-400/80" />
            <span className="size-2.5 rounded-full bg-amber-400/80" />
            <span className="size-2.5 rounded-full bg-emerald-400/80" />
          </span>
          <span className="truncate font-mono text-xs font-medium text-[var(--fg-muted)]">
            {languageName}
          </span>
        </div>

        <button
          type="button"
          onClick={copy}
          aria-label={copied ? 'Code copied' : 'Copy code'}
          className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-[var(--fg-muted)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)]"
        >
          {copied ? (
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-3.5 text-emerald-500"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          ) : (
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-3.5"
            >
              <rect x="9" y="9" width="12" height="12" rx="2" />
              <path d="M5 15V5a2 2 0 0 1 2-2h10" />
            </svg>
          )}
          <span aria-live="polite">{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>

      <pre ref={preRef} className={className} {...props}>
        {children}
      </pre>
    </div>
  );
}
