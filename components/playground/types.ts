/**
 * Shared shapes for parameterised code playgrounds.
 *
 * A playground is a code snippet whose inputs the reader can change, with the
 * derived numbers recomputing live. Nothing is executed — the calculator is a
 * plain TypeScript function that returns both the display tokens and the
 * results, so there is no interpreter, no WASM download, and no sandbox to get
 * wrong.
 */

export type TokenKind =
  | 'plain'
  | 'comment'
  | 'number'
  | 'keyword'
  | 'string'
  | 'fn'
  /** A value the reader is currently controlling — highlighted so it is findable. */
  | 'live';

export type Token = { t: string; k?: TokenKind };

/** One rendered line of code. */
export type Line = Token[];

export type ParamSpec = {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit?: string;
  /**
   * Log scale for ranges spanning orders of magnitude. A linear slider from
   * 1 to 1000 spends 90% of its travel above 100, which makes the interesting
   * low end unusable.
   */
  scale?: 'linear' | 'log';
  /** How to display the current value. Defaults to a plain locale number. */
  format?: (value: number) => string;
  /** Shown under the control. Explain what the number means, not what it is. */
  hint?: string;
};

export type Result = {
  label: string;
  value: string;
  /** The one number the snippet exists to produce. */
  emphasis?: boolean;
  note?: string;
};

export type CalculatorOutput = {
  lines: Line[];
  results: Result[];
  /**
   * Optional observation that changes with the inputs — this is where a
   * playground earns its place over a static snippet, by saying something the
   * reader could not have read off the page.
   */
  insight?: string;
};

export type Calculator = {
  /** Shown in the corner of the code panel, like a static block's language tag. */
  language: string;
  params: ParamSpec[];
  compute: (values: Record<string, number>) => CalculatorOutput;
};
