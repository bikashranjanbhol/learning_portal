'use client';

import { useMemo } from 'react';
import { SceneShell } from '../scene-shell';
import { usePlayback } from '../use-playback';

/**
 * Consistent hashing ring.
 *
 * Steps through: empty ring → nodes placed → keys placed → a node fails →
 * only that node's keys move. The point the reader should leave with is that
 * the surviving keys do not move, which is hard to convey in prose and obvious
 * in two frames.
 *
 * Pure SVG, no animation library. Positions are computed once and CSS
 * transitions do the interpolation, so stepping costs a repaint rather than a
 * JS-driven render loop.
 */

const NODES = [
  { id: 'A', angle: 30, colour: 'var(--viz-a)' },
  { id: 'B', angle: 130, colour: 'var(--viz-b)' },
  { id: 'C', angle: 215, colour: 'var(--viz-c)' },
  { id: 'D', angle: 310, colour: 'var(--viz-d)' },
];

const KEYS = [
  { id: 'k1', angle: 55 },
  { id: 'k2', angle: 95 },
  { id: 'k3', angle: 150 },
  { id: 'k4', angle: 190 },
  { id: 'k5', angle: 240 },
  { id: 'k6', angle: 285 },
  { id: 'k7', angle: 340 },
  { id: 'k8', angle: 10 },
];

const NARRATION = [
  'The hash space, drawn as a circle. Every possible key hashes to some point on it.',
  'Place the nodes on the ring by hashing their names. Four nodes, four positions.',
  'Place the keys the same way. Each key is owned by the first node clockwise from it.',
  'Node B fails. Only the keys in B’s arc need a new owner.',
  'B’s keys slide clockwise to C. Every other key stayed exactly where it was — that is the whole point.',
];

const CENTRE = { x: 200, y: 150 };
const RADIUS = 105;

function pointAt(angleDegrees: number, radius: number) {
  // -90 so 0° is at the top, which is how these are conventionally drawn.
  const radians = ((angleDegrees - 90) * Math.PI) / 180;
  return {
    x: CENTRE.x + radius * Math.cos(radians),
    y: CENTRE.y + radius * Math.sin(radians),
  };
}

/** First node clockwise from a key, skipping any that have failed. */
function ownerOf(keyAngle: number, failed: string[]): (typeof NODES)[number] {
  const alive = NODES.filter((node) => !failed.includes(node.id));
  const sorted = [...alive].sort((a, b) => a.angle - b.angle);
  const found = sorted.find((node) => node.angle >= keyAngle);
  return found ?? sorted[0]!;
}

export function HashRingScene() {
  const playback = usePlayback({ stepCount: NARRATION.length, intervalMs: 2000 });
  const { step } = playback;

  const showNodes = step >= 1;
  const showKeys = step >= 2;
  const failed = useMemo(() => (step >= 3 ? ['B'] : []), [step]);
  const keysHaveMoved = step >= 4;

  return (
    <SceneShell playback={playback} narration={NARRATION} label="Consistent hashing">
      <svg
        viewBox="0 0 400 300"
        className="h-full w-full"
        role="img"
        aria-label={`Consistent hashing ring, step ${step + 1} of ${NARRATION.length}. ${NARRATION[step]}`}
      >
        {/* Scene-local palette. Defined here rather than in globals.css so a
            scene is one self-contained file. */}
        <g
          style={
            {
              '--viz-a': '#4c6ef5',
              '--viz-b': '#f06595',
              '--viz-c': '#22b8cf',
              '--viz-d': '#94d82d',
            } as React.CSSProperties
          }
        >
          <circle
            cx={CENTRE.x}
            cy={CENTRE.y}
            r={RADIUS}
            fill="none"
            stroke="var(--border)"
            strokeWidth="2"
          />

          {/* Clockwise direction hint */}
          <text
            x={CENTRE.x}
            y={CENTRE.y + 4}
            textAnchor="middle"
            className="fill-[var(--fg-muted)] text-[11px]"
          >
            hash space
          </text>

          {NODES.map((node) => {
            const isFailed = failed.includes(node.id);
            const position = pointAt(node.angle, RADIUS);
            const labelPosition = pointAt(node.angle, RADIUS + 24);

            return (
              <g
                key={node.id}
                style={{
                  opacity: showNodes ? 1 : 0,
                  transition: 'opacity 400ms ease',
                }}
              >
                <rect
                  x={position.x - 9}
                  y={position.y - 9}
                  width="18"
                  height="18"
                  rx="4"
                  fill={isFailed ? 'var(--bg-subtle)' : node.colour}
                  stroke={isFailed ? '#fa5252' : 'none'}
                  strokeWidth="2"
                  strokeDasharray={isFailed ? '3 2' : undefined}
                  style={{ transition: 'fill 400ms ease' }}
                />
                <text
                  x={labelPosition.x}
                  y={labelPosition.y + 4}
                  textAnchor="middle"
                  className="text-[13px] font-semibold"
                  fill={isFailed ? '#fa5252' : 'var(--fg)'}
                >
                  {node.id}
                  {isFailed ? ' ✕' : ''}
                </text>
              </g>
            );
          })}

          {KEYS.map((key) => {
            const owner = ownerOf(key.angle, keysHaveMoved ? failed : []);
            const position = pointAt(key.angle, RADIUS - 26);
            const wasBs = ownerOf(key.angle, []).id === 'B';

            return (
              <circle
                key={key.id}
                cx={position.x}
                cy={position.y}
                r="6"
                fill={owner.colour}
                stroke={keysHaveMoved && wasBs ? 'var(--fg)' : 'none'}
                strokeWidth="2"
                style={{
                  opacity: showKeys ? 1 : 0,
                  transition: 'opacity 400ms ease, fill 500ms ease',
                }}
              />
            );
          })}

          {step >= 3 ? (
            <text
              x={CENTRE.x}
              y={285}
              textAnchor="middle"
              className="text-[12px]"
              fill="var(--fg-muted)"
            >
              {keysHaveMoved
                ? 'Outlined keys moved. 2 of 8 — roughly 1/N.'
                : 'B is gone. Which keys need a new owner?'}
            </text>
          ) : null}
        </g>
      </svg>
    </SceneShell>
  );
}
