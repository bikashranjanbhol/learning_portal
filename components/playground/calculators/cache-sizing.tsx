'use client';

import { ParameterisedCode } from '../parameterised-code';
import { bytes, compactNumber, underscored } from '../format';
import type { Calculator } from '../types';

/**
 * Cache sizing from a Zipfian access assumption.
 *
 * The reader changes total storage, record size, hot fraction and node size,
 * and watches the node count move. The insight the static snippet cannot make
 * is at the bottom: record size changes the *key count* but not the *cache
 * size*, because it cancels out. That is worth discovering by dragging a
 * slider and seeing a number not move.
 */
const calculator: Calculator = {
  language: 'python',

  params: [
    {
      id: 'totalStorageTB',
      label: 'Total dataset',
      min: 1,
      max: 1000,
      step: 1,
      defaultValue: 18,
      unit: ' TB',
      scale: 'log',
      hint: 'Everything on disk, across all shards.',
    },
    {
      id: 'recordKB',
      label: 'Bytes per record',
      min: 1,
      max: 1000,
      step: 1,
      defaultValue: 100,
      unit: ' KB',
      scale: 'log',
      hint: 'Average, including indexes.',
    },
    {
      id: 'hotPercent',
      label: 'Hot fraction',
      min: 0.1,
      max: 50,
      step: 0.1,
      defaultValue: 3,
      unit: '%',
      scale: 'log',
      format: (v) => (v < 1 ? v.toFixed(1) : v.toFixed(0)),
      hint: 'Share of keys serving most reads. ~3% is typical for Zipf(s≈1).',
    },
    {
      id: 'nodeGB',
      label: 'Memory per cache node',
      min: 8,
      max: 512,
      step: 8,
      defaultValue: 64,
      unit: ' GB',
      scale: 'log',
      hint: 'Usable, after overhead.',
    },
  ],

  compute(values) {
    const totalStorageTB = values['totalStorageTB'] ?? 18;
    const recordKB = values['recordKB'] ?? 100;
    const hotPercent = values['hotPercent'] ?? 3;
    const nodeGB = values['nodeGB'] ?? 64;

    const totalBytes = totalStorageTB * 1e12;
    const recordBytes = recordKB * 1e3;
    const totalKeys = totalBytes / recordBytes;
    const hotFraction = hotPercent / 100;
    const hotKeys = totalKeys * hotFraction;
    const cacheBytes = hotKeys * recordBytes;
    const cacheNodes = Math.max(1, Math.ceil(cacheBytes / (nodeGB * 1e9)));

    return {
      lines: [
        [{ t: '# Sizing from a Zipfian access assumption.', k: 'comment' }],
        [
          { t: 'TOTAL_BYTES      = ' },
          { t: underscored(totalBytes), k: 'live' },
          { t: `    # ${totalStorageTB} TB across all shards`, k: 'comment' },
        ],
        [
          { t: 'BYTES_PER_RECORD = ' },
          { t: underscored(recordBytes), k: 'live' },
          { t: `    # ${recordKB} KB average`, k: 'comment' },
        ],
        [],
        [
          { t: 'total_keys    = TOTAL_BYTES / BYTES_PER_RECORD' },
          { t: `   # ${compactNumber(totalKeys)} keys`, k: 'comment' },
        ],
        [
          { t: 'hot_fraction  = ' },
          { t: hotFraction.toFixed(4).replace(/0+$/, '') || '0', k: 'live' },
          { t: `          # top ${hotPercent}% of keys`, k: 'comment' },
        ],
        [
          { t: 'hot_keys      = total_keys * hot_fraction' },
          { t: `   # ${compactNumber(hotKeys)} keys`, k: 'comment' },
        ],
        [
          { t: 'cache_bytes   = hot_keys * BYTES_PER_RECORD' },
          { t: `  # ${bytes(cacheBytes)}`, k: 'comment' },
        ],
        [
          { t: 'cache_nodes   = ceil(cache_bytes / ' },
          { t: `${nodeGB}e9`, k: 'live' },
          { t: ')' },
        ],
        [],
        [
          { t: 'print', k: 'fn' },
          { t: '(' },
          { t: 'f"{cache_nodes} cache nodes"', k: 'string' },
          { t: ')' },
          { t: `    # => ${cacheNodes} cache nodes`, k: 'comment' },
        ],
      ],

      results: [
        { label: 'Total keys', value: compactNumber(totalKeys) },
        { label: 'Hot keys', value: compactNumber(hotKeys) },
        { label: 'Cache size', value: bytes(cacheBytes) },
        {
          label: 'Cache nodes',
          value: `${cacheNodes}`,
          emphasis: true,
        },
      ],

      insight:
        cacheNodes === 1
          ? 'One node holds the whole hot set — at this size a cache is a single machine, and the interesting question becomes what happens when it restarts.'
          : `Notice that changing bytes per record moves the key count but not the cache size: record size appears in both the numerator and denominator, so it cancels. Cache size is always total storage × hot fraction — here ${bytes(totalBytes)} × ${hotPercent}% = ${bytes(cacheBytes)}.`,
    };
  },
};

export function CacheSizingPlayground() {
  return <ParameterisedCode calculator={calculator} title="Size the cache" />;
}
