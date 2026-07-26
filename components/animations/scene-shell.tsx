'use client';

import type { ReactNode } from 'react';
import { PlaybackControls } from './playback-controls';
import type { Playback } from './use-playback';

/**
 * Common chrome for a stepped scene: drawing area, caption strip, controls.
 *
 * Scenes render only their own SVG and hand the rest to this, so the controls
 * and layout are identical everywhere and a new scene has no chrome to write.
 */
export function SceneShell({
  playback,
  narration,
  children,
  label,
}: {
  playback: Playback;
  /** One line per step explaining what just happened. */
  narration?: string[];
  children: ReactNode;
  label?: string;
}) {
  const line = narration?.[playback.step];

  return (
    <div className="flex h-full w-full flex-col bg-[var(--bg-subtle)]">
      <div className="min-h-0 flex-1">{children}</div>

      {line ? (
        // Fixed height so a one-line and a two-line narration do not resize the
        // drawing area between steps.
        <p className="flex min-h-[3rem] items-center px-4 py-2 text-sm text-pretty text-[var(--fg-muted)]">
          {line}
        </p>
      ) : null}

      <PlaybackControls playback={playback} label={label} />
    </div>
  );
}
