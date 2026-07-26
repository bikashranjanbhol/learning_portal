'use client';

import { SceneShell } from '../scene-shell';
import { usePlayback } from '../use-playback';

const STAGES = [
  { name: 'Connection', detail: 'DNS, TCP, and TLS', ms: 40, colour: '#3b82f6' },
  { name: 'Request travel', detail: 'Client → server', ms: 80, colour: '#8b5cf6' },
  { name: 'Server queue', detail: 'Waiting for capacity', ms: 25, colour: '#ec4899' },
  { name: 'Backend', detail: 'Rules and processing', ms: 35, colour: '#f97316' },
  { name: 'Database', detail: 'Query and storage', ms: 90, colour: '#eab308' },
  { name: 'Response travel', detail: 'Server → client', ms: 80, colour: '#14b8a6' },
  { name: 'Browser render', detail: 'Layout and paint', ms: 50, colour: '#22c55e' },
] as const;

const TOTAL = STAGES.reduce((sum, stage) => sum + stage.ms, 0);
const STARTS = STAGES.map((_, index) =>
  STAGES.slice(0, index).reduce((sum, stage) => sum + stage.ms, 0),
);
const NARRATION = STAGES.map(
  (stage, index) =>
    `${stage.name} occupies ${STARTS[index]}–${STARTS[index]! + stage.ms} ms in this illustrative trace. Measure a real request before choosing an optimisation.`,
);

function Phase({ step, mobile = false }: { step: number; mobile?: boolean }) {
  return (
    <>
      <rect
        x={mobile ? 65 : 255}
        y="12"
        width={mobile ? 230 : 250}
        height={mobile ? 28 : 30}
        rx="15"
        fill="var(--bg)"
        stroke="var(--border)"
      />
      <text
        x={mobile ? 180 : 380}
        y={mobile ? 30 : 32}
        textAnchor="middle"
        fill="var(--fg)"
        className="text-[10px] font-semibold sm:text-[11px]"
      >
        {step + 1}. {STAGES[step]!.name} · {STAGES[step]!.ms} ms
      </text>
    </>
  );
}

function Desktop({ step }: { step: number }) {
  const timelineX = 190;
  const timelineWidth = 520;
  const scale = timelineWidth / TOTAL;
  const cursorX = timelineX + (STARTS[step]! + STAGES[step]!.ms) * scale;

  return (
    <svg
      viewBox="0 0 760 430"
      className="hidden h-full w-full sm:block"
      role="img"
      aria-label={NARRATION[step]}
    >
      <Phase step={step} />

      <text x="20" y="66" fill="var(--fg-muted)" className="text-[9px] font-semibold">
        REQUEST TRACE
      </text>
      {[0, 100, 200, 300, 400].map((tick) => {
        const x = timelineX + tick * scale;
        return (
          <g key={tick}>
            <line x1={x} y1="70" x2={x} y2="388" stroke="var(--border)" strokeDasharray="3 5" />
            <text
              x={x}
              y="63"
              textAnchor="middle"
              fill="var(--fg-muted)"
              className="font-mono text-[8px]"
            >
              {tick} ms
            </text>
          </g>
        );
      })}

      {STAGES.map((stage, index) => {
        const y = 78 + index * 43;
        const start = STARTS[index]!;
        const x = timelineX + start * scale;
        const width = stage.ms * scale;
        const active = index === step;

        return (
          <g key={stage.name}>
            <rect
              x="12"
              y={y}
              width="164"
              height="34"
              rx="7"
              fill={active ? 'color-mix(in srgb, var(--accent) 8%, var(--bg))' : 'var(--bg)'}
              stroke={active ? 'var(--accent)' : 'var(--border)'}
              strokeWidth={active ? 2 : 1}
            />
            <circle cx="27" cy={y + 17} r="5" fill={stage.colour} />
            <text x="39" y={y + 14} fill="var(--fg)" className="text-[9px] font-semibold">
              {stage.name}
            </text>
            <text x="39" y={y + 27} fill="var(--fg-muted)" className="text-[7px]">
              {stage.detail}
            </text>

            <rect
              x={x}
              y={y + 5}
              width={Math.max(width, 4)}
              height="24"
              rx="5"
              fill={stage.colour}
              opacity={active ? 1 : 0.42}
            />
            <text
              x={x + width / 2}
              y={y + 21}
              textAnchor="middle"
              fill="white"
              className="font-mono text-[7px] font-semibold"
            >
              {stage.ms} ms
            </text>
          </g>
        );
      })}

      <line x1={cursorX} y1="70" x2={cursorX} y2="388" stroke="var(--accent)" strokeWidth="2" />
      <circle cx={cursorX} cy="70" r="4" fill="var(--accent)" />

      <rect
        x="270"
        y="394"
        width="220"
        height="25"
        rx="12.5"
        fill="var(--bg)"
        stroke="var(--border)"
      />
      <text
        x="380"
        y="411"
        textAnchor="middle"
        fill="var(--fg)"
        className="font-mono text-[9px] font-semibold"
      >
        elapsed {STARTS[step]! + STAGES[step]!.ms} / {TOTAL} ms
      </text>
    </svg>
  );
}

function Mobile({ step }: { step: number }) {
  return (
    <svg
      viewBox="0 0 360 650"
      className="h-full w-full sm:hidden"
      role="img"
      aria-label={NARRATION[step]}
    >
      <Phase step={step} mobile />
      <text x="25" y="66" fill="var(--fg-muted)" className="text-[8px] font-semibold">
        VERTICAL REQUEST TRACE
      </text>

      <line x1="44" y1="82" x2="44" y2="548" stroke="var(--border)" strokeWidth="3" />

      {STAGES.map((stage, index) => {
        const y = 78 + index * 68;
        const active = index === step;
        const start = STARTS[index]!;
        const end = start + stage.ms;

        return (
          <g key={stage.name}>
            <line
              x1="44"
              y1={y + 8}
              x2="44"
              y2={y + 62}
              stroke={stage.colour}
              strokeWidth={active ? 7 : 5}
              opacity={active ? 1 : 0.4}
            />
            <circle
              cx="44"
              cy={y + 8}
              r={active ? 7 : 5}
              fill={stage.colour}
              stroke="var(--bg)"
              strokeWidth="2"
            />
            <rect
              x="68"
              y={y}
              width="272"
              height="54"
              rx="10"
              fill={active ? 'color-mix(in srgb, var(--accent) 8%, var(--bg))' : 'var(--bg)'}
              stroke={active ? 'var(--accent)' : 'var(--border)'}
              strokeWidth={active ? 2 : 1}
            />
            <text x="84" y={y + 20} fill="var(--fg)" className="text-[10px] font-semibold">
              {stage.name}
            </text>
            <text x="84" y={y + 38} fill="var(--fg-muted)" className="text-[8px]">
              {stage.detail}
            </text>
            <text
              x="325"
              y={y + 23}
              textAnchor="end"
              fill={active ? 'var(--accent)' : 'var(--fg)'}
              className="font-mono text-[9px] font-semibold"
            >
              {stage.ms} ms
            </text>
            <text
              x="325"
              y={y + 39}
              textAnchor="end"
              fill="var(--fg-muted)"
              className="font-mono text-[7px]"
            >
              {start}–{end} ms
            </text>
          </g>
        );
      })}

      <rect
        x="70"
        y="570"
        width="220"
        height="28"
        rx="14"
        fill="var(--bg)"
        stroke="var(--border)"
      />
      <text
        x="180"
        y="588"
        textAnchor="middle"
        fill="var(--fg)"
        className="font-mono text-[9px] font-semibold"
      >
        total request · {TOTAL} ms
      </text>
      <text x="180" y="624" textAnchor="middle" fill="var(--fg-muted)" className="text-[8px]">
        Illustrative values · measure your real system
      </text>
    </svg>
  );
}

export function LatencyBreakdownScene() {
  const playback = usePlayback({ stepCount: STAGES.length });

  return (
    <SceneShell playback={playback} narration={NARRATION} label="Request trace">
      <Desktop step={playback.step} />
      <Mobile step={playback.step} />
    </SceneShell>
  );
}
