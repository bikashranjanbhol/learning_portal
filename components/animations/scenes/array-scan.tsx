'use client';

import { SceneShell } from '../scene-shell';
import { usePlayback } from '../use-playback';

/**
 * Array visualiser — two-pointer scan.
 *
 * The generic primitive here is `<ArrayCells>`: a row of labelled cells where
 * each index carries a state. Reuse it for sorting, sliding window, binary
 * search, partitioning — anything that highlights positions over time. This
 * scene is one configuration of it, not a bespoke drawing.
 */

const VALUES = [2, 7, 11, 15, 19, 24];
const TARGET = 26;

type CellState = 'idle' | 'left' | 'right' | 'found' | 'discarded';

/** Two-pointer walk, precomputed. Deriving frames up front keeps stepping cheap. */
type Frame = { left: number; right: number; sum: number; note: string; solved: boolean };

function buildFrames(): Frame[] {
  const frames: Frame[] = [];
  let left = 0;
  let right = VALUES.length - 1;

  while (left < right) {
    const sum = VALUES[left]! + VALUES[right]!;

    if (sum === TARGET) {
      frames.push({
        left,
        right,
        sum,
        note: `${VALUES[left]} + ${VALUES[right]} = ${TARGET}. Found it.`,
        solved: true,
      });
      break;
    }

    if (sum < TARGET) {
      frames.push({
        left,
        right,
        sum,
        note: `${VALUES[left]} + ${VALUES[right]} = ${sum}, below ${TARGET}. Nothing to the left of ${VALUES[left]} can help — move left pointer right.`,
        solved: false,
      });
      left += 1;
    } else {
      frames.push({
        left,
        right,
        sum,
        note: `${VALUES[left]} + ${VALUES[right]} = ${sum}, above ${TARGET}. Move right pointer left.`,
        solved: false,
      });
      right -= 1;
    }
  }

  return frames;
}

const FRAMES = buildFrames();

const STATE_STYLES: Record<CellState, string> = {
  idle: 'border-[var(--border)] bg-[var(--bg)] text-[var(--fg)]',
  left: 'border-blue-500 bg-blue-500/15 text-[var(--fg)]',
  right: 'border-pink-500 bg-pink-500/15 text-[var(--fg)]',
  found: 'border-emerald-500 bg-emerald-500/25 text-[var(--fg)]',
  discarded: 'border-[var(--border)] bg-[var(--bg)] text-[var(--fg-muted)] opacity-40',
};

/**
 * Reusable array row.
 *
 * Exported so other scenes can build on it — this is the primitive, the scene
 * below is one use of it.
 */
export function ArrayCells({
  values,
  states,
  pointers,
}: {
  values: number[];
  states: CellState[];
  pointers?: Record<number, string>;
}) {
  return (
    <div className="flex flex-wrap items-start justify-center gap-2 px-4">
      {values.map((value, index) => (
        <div key={index} className="flex flex-col items-center gap-1">
          <div
            className={`flex size-12 items-center justify-center rounded-lg border-2 font-mono text-sm font-semibold transition-colors duration-300 ${
              STATE_STYLES[states[index] ?? 'idle']
            }`}
          >
            {value}
          </div>
          <span className="font-mono text-[10px] text-[var(--fg-muted)]">{index}</span>
          {/* Fixed-height pointer slot so labels appearing do not shift the row. */}
          <span className="h-4 font-mono text-[10px] font-semibold text-[var(--fg)]">
            {pointers?.[index] ?? ''}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ArrayScanScene() {
  const playback = usePlayback({ stepCount: FRAMES.length, intervalMs: 1800 });
  const frame = FRAMES[playback.step]!;

  const states: CellState[] = VALUES.map((_, index) => {
    if (frame.solved && (index === frame.left || index === frame.right)) return 'found';
    if (index === frame.left) return 'left';
    if (index === frame.right) return 'right';
    if (index < frame.left || index > frame.right) return 'discarded';
    return 'idle';
  });

  const pointers: Record<number, string> = {
    [frame.left]: frame.left === frame.right ? 'L R' : 'L',
    [frame.right]: frame.right === frame.left ? 'L R' : 'R',
  };

  const narration = FRAMES.map((f) => f.note);

  return (
    <SceneShell playback={playback} narration={narration} label={`target = ${TARGET}`}>
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <ArrayCells values={VALUES} states={states} pointers={pointers} />
        <p className="font-mono text-sm text-[var(--fg-muted)] tabular-nums">
          {VALUES[frame.left]} + {VALUES[frame.right]} ={' '}
          <span className={frame.solved ? 'font-bold text-emerald-500' : 'text-[var(--fg)]'}>
            {frame.sum}
          </span>
        </p>
      </div>
    </SceneShell>
  );
}
