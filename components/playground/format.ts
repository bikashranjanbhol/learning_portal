/** Number formatting shared by calculators. Kept out of the components so the display in the code panel and in the results cannot disagree. */

export function compactNumber(value: number): string {
  if (value >= 1e12) return `${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toFixed(0);
}

export function bytes(value: number): string {
  if (value >= 1e15) return `${(value / 1e15).toFixed(1)} PB`;
  if (value >= 1e12) return `${(value / 1e12).toFixed(1)} TB`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(0)} GB`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(0)} MB`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(0)} KB`;
  return `${value.toFixed(0)} B`;
}

/** Underscore separators, matching how the static snippets are written. */
export function underscored(value: number): string {
  return Math.round(value).toLocaleString('en-US').replace(/,/g, '_');
}

export function perSecond(value: number): string {
  return `${compactNumber(value)}/sec`;
}
