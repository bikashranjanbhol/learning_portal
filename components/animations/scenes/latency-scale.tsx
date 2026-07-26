'use client';

import { SceneShell } from '../scene-shell';
import { usePlayback } from '../use-playback';

/**
 * Latency numbers, revealed one order of magnitude at a time.
 *
 * The bar is log-scaled, because on a linear scale everything except the
 * network round trip is a single invisible pixel — which is itself the point
 * the diagram is making, but it makes for a useless chart. The "if this took
 * one second" column is what actually lands: it turns nanoseconds into
 * durations a person can hold in their head.
 */

type Row = {
  label: string;
  nanoseconds: number;
  humanScale: string;
  colour: string;
};

const ROWS: Row[] = [
  { label: 'L1 cache reference', nanoseconds: 1, humanScale: '1 second', colour: '#94d82d' },
  { label: 'Branch mispredict', nanoseconds: 3, humanScale: '3 seconds', colour: '#94d82d' },
  {
    label: 'Main memory reference',
    nanoseconds: 100,
    humanScale: '1.5 minutes',
    colour: '#22b8cf',
  },
  { label: 'SSD random read', nanoseconds: 100_000, humanScale: '1 day', colour: '#4c6ef5' },
  {
    label: 'Round trip in a datacenter',
    nanoseconds: 500_000,
    humanScale: '6 days',
    colour: '#7950f2',
  },
  {
    label: 'Disk seek (spinning)',
    nanoseconds: 10_000_000,
    humanScale: '4 months',
    colour: '#f06595',
  },
  {
    label: 'Round trip across the Atlantic',
    nanoseconds: 150_000_000,
    humanScale: '5 years',
    colour: '#fa5252',
  },
];

const NARRATION = ROWS.map(
  (row) =>
    `${row.label}: ${formatNanoseconds(row.nanoseconds)}. If an L1 hit took one second, this would take ${row.humanScale}.`,
);

function formatNanoseconds(value: number): string {
  if (value < 1_000) return `${value} ns`;
  if (value < 1_000_000) return `${(value / 1_000).toFixed(0)} µs`;
  return `${(value / 1_000_000).toFixed(0)} ms`;
}

const MAX_LOG = Math.log10(ROWS[ROWS.length - 1]!.nanoseconds);

export function LatencyScaleScene() {
  const playback = usePlayback({ stepCount: ROWS.length, intervalMs: 1500 });
  const { step } = playback;

  return (
    <SceneShell playback={playback} narration={NARRATION} label="log scale">
      <div className="flex h-full flex-col justify-center gap-1.5 px-4 py-2">
        {ROWS.map((row, index) => {
          const revealed = index <= step;
          const widthPercent = (Math.log10(row.nanoseconds) / MAX_LOG) * 100;

          return (
            <div
              key={row.label}
              className="grid grid-cols-[1fr_auto] items-center gap-3"
              style={{
                opacity: revealed ? 1 : 0.15,
                transition: 'opacity 350ms ease',
              }}
            >
              <div className="min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[11px] text-[var(--fg-muted)]">
                    {row.label}
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-[var(--fg)] tabular-nums">
                    {formatNanoseconds(row.nanoseconds)}
                  </span>
                </div>
                <div className="mt-0.5 h-2 w-full overflow-hidden rounded-full bg-[var(--bg)]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: revealed ? `${Math.max(widthPercent, 3)}%` : '0%',
                      background: row.colour,
                      transition: 'width 500ms cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  />
                </div>
              </div>

              <span
                className={`w-20 shrink-0 text-right font-mono text-[11px] tabular-nums ${
                  index === step ? 'font-bold text-[var(--fg)]' : 'text-[var(--fg-muted)]'
                }`}
              >
                {row.humanScale}
              </span>
            </div>
          );
        })}
      </div>
    </SceneShell>
  );
}
