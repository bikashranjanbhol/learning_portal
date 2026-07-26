'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type PlaybackOptions = {
  /** Total number of steps. Step indices run 0…stepCount-1. */
  stepCount: number;
  /** Milliseconds per step at 1× speed. */
  intervalMs?: number;
  /** Start playing as soon as the scene mounts. Off by default — see below. */
  autoPlay?: boolean;
  loop?: boolean;
};

export type Playback = {
  step: number;
  isPlaying: boolean;
  speed: number;
  stepCount: number;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  reset: () => void;
  goTo: (step: number) => void;
  setSpeed: (speed: number) => void;
  isFirst: boolean;
  isLast: boolean;
};

const SPEEDS = [0.5, 1, 2] as const;

/**
 * Playback state for a stepped animation.
 *
 * Every scene drives off this rather than owning its own timer, which is what
 * makes a new animation an afternoon of drawing rather than a day of
 * re-implementing controls (CLAUDE.md/Sprint 5: build the framework, not 200
 * bespoke animations).
 *
 * Two deliberate defaults:
 *
 * - `autoPlay` is off. An animation that starts moving while someone is reading
 *   the paragraph above it is a distraction, and on a page with several of them
 *   it is also continuous main-thread work competing with hydration — straight
 *   into the INP budget.
 * - Playback pauses when `prefers-reduced-motion` is set, and the controls stay
 *   usable so the reader can still step through manually.
 */
export function usePlayback({
  stepCount,
  intervalMs = 1200,
  autoPlay = false,
  loop = false,
}: PlaybackOptions): Playback {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [speed, setSpeed] = useState(1);
  const timer = useRef<number | null>(null);

  const isFirst = step === 0;
  const isLast = step >= stepCount - 1;

  // Respect the OS-level motion preference. Reading it here rather than in CSS
  // because the fix is "do not run the timer", not "shorten the transition".
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (query.matches) setIsPlaying(false);

    function onChange(event: MediaQueryListEvent) {
      if (event.matches) setIsPlaying(false);
    }
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    timer.current = window.setInterval(() => {
      setStep((current) => {
        if (current >= stepCount - 1) {
          if (loop) return 0;
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, intervalMs / speed);

    return () => {
      if (timer.current !== null) window.clearInterval(timer.current);
    };
  }, [isPlaying, speed, intervalMs, stepCount, loop]);

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const toggle = useCallback(() => setIsPlaying((value) => !value), []);

  // Stepping manually stops playback — otherwise the timer fights the reader.
  const next = useCallback(() => {
    setIsPlaying(false);
    setStep((current) => Math.min(current + 1, stepCount - 1));
  }, [stepCount]);

  const previous = useCallback(() => {
    setIsPlaying(false);
    setStep((current) => Math.max(current - 1, 0));
  }, []);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setStep(0);
  }, []);

  const goTo = useCallback(
    (target: number) => {
      setIsPlaying(false);
      setStep(Math.max(0, Math.min(target, stepCount - 1)));
    },
    [stepCount],
  );

  const changeSpeed = useCallback((value: number) => {
    setSpeed(SPEEDS.includes(value as (typeof SPEEDS)[number]) ? value : 1);
  }, []);

  return {
    step,
    isPlaying,
    speed,
    stepCount,
    play,
    pause,
    toggle,
    next,
    previous,
    reset,
    goTo,
    setSpeed: changeSpeed,
    isFirst,
    isLast,
  };
}

export { SPEEDS };
