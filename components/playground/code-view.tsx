'use client';

import type { Line, TokenKind } from './types';

/**
 * Renders tokenised code.
 *
 * Static code blocks are highlighted at build time by Shiki, which cannot help
 * here because the text changes as the reader moves a slider. Rather than ship
 * a highlighter to the client — the whole point of the build-time approach was
 * to avoid that — the calculator emits tokens directly and this maps them to a
 * small palette chosen to sit close to the Shiki themes.
 *
 * The palette is intentionally short. Matching Shiki exactly would mean
 * shipping its grammar, which is the cost we are avoiding.
 */
const TOKEN_CLASS: Record<TokenKind, string> = {
  plain: 'text-[var(--fg)]',
  comment: 'text-[var(--fg-muted)]',
  number: 'text-emerald-600 dark:text-emerald-400',
  keyword: 'text-purple-600 dark:text-purple-400',
  string: 'text-blue-600 dark:text-blue-400',
  fn: 'text-amber-600 dark:text-amber-400',
  // Reader-controlled values: underlined so they are findable in the snippet
  // without hunting, and visually tied to the control that changes them.
  live: 'rounded bg-[var(--accent)]/15 px-1 font-semibold text-[var(--accent)] underline decoration-[var(--accent)]/40 underline-offset-2',
};

export function CodeView({ lines, language }: { lines: Line[]; language?: string }) {
  return (
    <div className="relative min-w-0">
      {language ? (
        <span className="absolute top-0 right-3 font-mono text-[10px] tracking-wide text-[var(--fg-muted)] uppercase select-none">
          {language}
        </span>
      ) : null}

      <pre className="overflow-x-auto px-4 py-3 font-mono text-[13px] leading-relaxed">
        <code className="grid">
          {lines.map((line, lineIndex) => (
            // Lines are positional and have no stable id; index is the correct
            // key here because the list is regenerated wholesale on each change.
            <span key={lineIndex} className="min-h-[1.4em]">
              {line.map((token, tokenIndex) => (
                <span key={tokenIndex} className={TOKEN_CLASS[token.k ?? 'plain']}>
                  {token.t}
                </span>
              ))}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
