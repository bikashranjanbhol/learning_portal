'use client';

import { useCallback, useRef, useState, type ReactNode } from 'react';

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
  ...props
}: {
  children?: ReactNode;
  language?: string;
} & React.HTMLAttributes<HTMLPreElement>) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

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
    <div className="group relative my-6">
      {language ? (
        <span className="absolute top-2.5 left-4 font-mono text-[11px] tracking-wide text-[var(--fg-muted)] uppercase select-none">
          {language}
        </span>
      ) : null}

      <button
        type="button"
        onClick={copy}
        aria-label={copied ? 'Copied' : 'Copy code'}
        className="absolute top-2 right-2 z-10 inline-flex size-8 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--bg)] text-[var(--fg-muted)] opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
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
            className="size-3.5"
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
      </button>

      <pre ref={preRef} {...props}>
        {children}
      </pre>
    </div>
  );
}
