'use client';

import { useMemo, useState } from 'react';
import { CodeView } from './code-view';
import { ParamControl } from './param-control';
import type { Calculator } from './types';

/**
 * Generic playground UI: controls on one side, live code and results on the
 * other.
 *
 * Every calculator gets this for free — a new one is a config object, not a new
 * component. Same principle as the animation framework: the expensive part is
 * the chrome, so it is written once.
 */
export function ParameterisedCode({
  calculator,
  title,
}: {
  calculator: Calculator;
  title?: string;
}) {
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(calculator.params.map((param) => [param.id, param.defaultValue])),
  );

  // compute() is pure and cheap, but it runs on every slider frame — memoising
  // keeps dragging smooth on a low-end phone, which is the device the INP
  // budget is written for.
  const output = useMemo(() => calculator.compute(values), [calculator, values]);

  const isDirty = calculator.params.some((param) => values[param.id] !== param.defaultValue);

  function reset() {
    setValues(
      Object.fromEntries(calculator.params.map((param) => [param.id, param.defaultValue])),
    );
  }

  return (
    <div className="not-prose overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-2">
        <p className="text-xs font-semibold">{title ?? 'Try it with your own numbers'}</p>
        <button
          type="button"
          onClick={reset}
          disabled={!isDirty}
          className="rounded-md border border-[var(--border)] px-2 py-1 text-[11px] text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)] disabled:opacity-40"
        >
          Reset
        </button>
      </div>

      <div className="grid gap-0 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4 border-b border-[var(--border)] p-4 lg:border-r lg:border-b-0">
          {calculator.params.map((param) => (
            <ParamControl
              key={param.id}
              spec={param}
              value={values[param.id] ?? param.defaultValue}
              onChange={(next) => setValues((current) => ({ ...current, [param.id]: next }))}
            />
          ))}
        </div>

        <div className="min-w-0">
          <CodeView lines={output.lines} language={calculator.language} />

          <div
            className="border-t border-[var(--border)] p-4"
            // The results are the outcome of the interaction, so this is what
            // gets announced — once, after the value settles.
            aria-live="polite"
            aria-atomic="true"
          >
            <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {output.results.map((result) => (
                <div key={result.label} className="flex items-baseline justify-between gap-3">
                  <dt className="text-xs text-[var(--fg-muted)]">{result.label}</dt>
                  <dd
                    className={
                      result.emphasis
                        ? 'font-mono text-sm font-bold text-[var(--accent)] tabular-nums'
                        : 'font-mono text-xs text-[var(--fg)] tabular-nums'
                    }
                  >
                    {result.value}
                  </dd>
                </div>
              ))}
            </dl>

            {output.insight ? (
              <p className="mt-4 border-t border-[var(--border)] pt-3 text-xs text-pretty text-[var(--fg-muted)]">
                {output.insight}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
