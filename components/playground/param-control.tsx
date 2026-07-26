'use client';

import { useId } from 'react';
import type { ParamSpec } from './types';

/**
 * Slider ↔ value conversion.
 *
 * Log-scaled params keep the slider position linear in the exponent, so the
 * low end of a 1–1000 range is as reachable as the high end. Without this a
 * "records per second" control is unusable below about 10% of its range.
 */
function toSlider(spec: ParamSpec, value: number): number {
  if (spec.scale !== 'log') return value;
  return Math.log10(Math.max(value, spec.min));
}

function fromSlider(spec: ParamSpec, position: number): number {
  if (spec.scale !== 'log') return position;
  const raw = 10 ** position;
  // Snap to 2 significant figures — a log slider otherwise produces 183.7412
  // and the snippet looks like noise.
  const magnitude = 10 ** Math.floor(Math.log10(raw) - 1);
  return Math.round(raw / magnitude) * magnitude;
}

export function ParamControl({
  spec,
  value,
  onChange,
}: {
  spec: ParamSpec;
  value: number;
  onChange: (value: number) => void;
}) {
  const id = useId();
  const isLog = spec.scale === 'log';

  const sliderMin = isLog ? Math.log10(spec.min) : spec.min;
  const sliderMax = isLog ? Math.log10(spec.max) : spec.max;
  const sliderStep = isLog ? 0.01 : spec.step;

  const display = spec.format ? spec.format(value) : value.toLocaleString('en-GB');

  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-xs font-medium text-[var(--fg)]">
          {spec.label}
        </label>
        <output
          htmlFor={id}
          className="font-mono text-xs text-[var(--accent)] tabular-nums"
          // Not aria-live: the results panel announces the outcome. Announcing
          // every intermediate value while dragging would be unusable.
        >
          {display}
          {spec.unit ? (
            <span className="ml-0.5 text-[var(--fg-muted)]">{spec.unit}</span>
          ) : null}
        </output>
      </div>

      <input
        id={id}
        type="range"
        min={sliderMin}
        max={sliderMax}
        step={sliderStep}
        value={toSlider(spec, value)}
        onChange={(event) => onChange(fromSlider(spec, Number(event.target.value)))}
        aria-valuetext={`${display}${spec.unit ?? ''}`}
        className="mt-1.5 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[var(--border)] accent-[var(--accent)]"
      />

      {spec.hint ? (
        <p className="mt-1 text-[11px] text-pretty text-[var(--fg-muted)]">{spec.hint}</p>
      ) : null}
    </div>
  );
}
