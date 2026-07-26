'use client';

import { ParameterisedCode } from '../parameterised-code';
import { compactNumber, perSecond } from '../format';
import type { Calculator } from '../types';

/**
 * Shards needed behind a cache, as a function of hit rate.
 *
 * This is the chapter's non-linearity argument made tactile: dragging hit rate
 * from 99% to 90% sounds like a 9% change and multiplies miss traffic tenfold.
 * Reading that in prose is forgettable; watching the shard count jump while the
 * slider barely moves is not.
 */
const calculator: Calculator = {
  language: 'typescript',

  params: [
    {
      id: 'readsPerSecond',
      label: 'Reads per second',
      min: 100,
      max: 1_000_000,
      step: 100,
      defaultValue: 10_000,
      scale: 'log',
      format: (v) => compactNumber(v),
      hint: 'At peak, not average.',
    },
    {
      id: 'hitRatePercent',
      label: 'Cache hit rate',
      min: 0,
      max: 99.9,
      step: 0.1,
      defaultValue: 99,
      unit: '%',
      format: (v) => v.toFixed(1),
      hint: 'Drag this one slowly — the cost is not linear.',
    },
    {
      id: 'shardCapacity',
      label: 'Reads per shard',
      min: 100,
      max: 20_000,
      step: 100,
      defaultValue: 500,
      scale: 'log',
      format: (v) => compactNumber(v),
      hint: 'What one Postgres primary serves comfortably.',
    },
  ],

  compute(values) {
    const readsPerSecond = values['readsPerSecond'] ?? 10_000;
    const hitRatePercent = values['hitRatePercent'] ?? 99;
    const shardCapacity = values['shardCapacity'] ?? 500;

    const hitRate = hitRatePercent / 100;
    const missesPerSecond = readsPerSecond * (1 - hitRate);
    const shardsNeeded = Math.max(1, Math.ceil(missesPerSecond / shardCapacity));

    // What the same traffic would cost with no cache at all — the number that
    // justifies the cache existing.
    const shardsWithoutCache = Math.max(1, Math.ceil(readsPerSecond / shardCapacity));

    return {
      lines: [
        [
          { t: 'const', k: 'keyword' },
          { t: ' readsPerSecond = ' },
          { t: underscore(readsPerSecond), k: 'live' },
          { t: ';' },
        ],
        [
          { t: 'const', k: 'keyword' },
          { t: ' hitRate        = ' },
          { t: hitRate.toFixed(3).replace(/0+$/, '').replace(/\.$/, ''), k: 'live' },
          { t: ';' },
          { t: `        // ${hitRatePercent.toFixed(1)}%`, k: 'comment' },
        ],
        [],
        [{ t: '// Only misses reach Postgres.', k: 'comment' }],
        [
          { t: 'const', k: 'keyword' },
          { t: ' misses = readsPerSecond * (' },
          { t: '1', k: 'number' },
          { t: ' - hitRate);' },
          { t: `  // ${perSecond(missesPerSecond)}`, k: 'comment' },
        ],
        [],
        [
          { t: 'const', k: 'keyword' },
          { t: ' shards = ' },
          { t: 'Math', k: 'fn' },
          { t: '.ceil(misses / ' },
          { t: underscore(shardCapacity), k: 'live' },
          { t: ');' },
        ],
        [{ t: `// => ${shardsNeeded} shard${shardsNeeded === 1 ? '' : 's'}`, k: 'comment' }],
      ],

      results: [
        { label: 'Misses reaching Postgres', value: perSecond(missesPerSecond) },
        { label: 'Shards without any cache', value: `${shardsWithoutCache}` },
        { label: 'Shards needed', value: `${shardsNeeded}`, emphasis: true },
        {
          label: 'Saved by the cache',
          value: `${shardsWithoutCache - shardsNeeded} shards`,
        },
      ],

      insight:
        hitRatePercent >= 99
          ? `At ${hitRatePercent.toFixed(1)}% the cache absorbs almost everything — ${shardsNeeded} shard${shardsNeeded === 1 ? '' : 's'} instead of ${shardsWithoutCache}. Now drag the hit rate down to 90% and watch what a "small" nine-point drop costs.`
          : hitRatePercent >= 50
            ? `Dropping to ${hitRatePercent.toFixed(1)}% multiplied miss traffic to ${perSecond(missesPerSecond)}. Hit rate is not a performance metric here — it is the capacity plan for everything behind it.`
            : `Below about 50% the cache is barely earning its keep: you are provisioning ${shardsNeeded} shards and still paying for the cache tier. At this hit rate, question whether the working set assumption is right.`,
    };
  },
};

/** Underscore separators to match how the static snippets are written. */
function underscore(value: number): string {
  return Math.round(value).toLocaleString('en-US').replace(/,/g, '_');
}

export function ShardSizingPlayground() {
  return <ParameterisedCode calculator={calculator} title="Size the shards behind it" />;
}
