'use client';

import { SceneShell } from '../scene-shell';
import { usePlayback } from '../use-playback';

const STEPS = [
  {
    phase: 'User action',
    payload: 'View products',
    narration: 'The customer asks the browser to load the product catalogue.',
  },
  {
    phase: 'HTTPS request',
    payload: 'GET /products',
    narration: 'The browser encrypts and sends an HTTPS request to the application server.',
  },
  {
    phase: 'Server processing',
    payload: 'Validate → route',
    narration: 'The application server validates the request and decides which data it needs.',
  },
  {
    phase: 'Database query',
    payload: 'SELECT products',
    narration: 'The server sends a query for the available products.',
  },
  {
    phase: 'Database result',
    payload: 'Product rows',
    narration: 'The relational database returns the matching product rows.',
  },
  {
    phase: 'HTTPS response',
    payload: '200 OK + JSON',
    narration: 'The server builds an HTTPS response and the browser renders the catalogue.',
  },
];

const NARRATION = STEPS.map((step) => step.narration);

type NodeKind = 'browser' | 'server' | 'database';

function NodeIcon({ kind }: { kind: NodeKind }) {
  if (kind === 'browser') {
    return (
      <>
        <rect x="-25" y="-19" width="50" height="36" rx="4" fill="none" stroke="currentColor" />
        <path d="M-25-9h50M-18-14h1M-12-14h1M-8 23h16" stroke="currentColor" />
      </>
    );
  }

  if (kind === 'server') {
    return (
      <>
        {[-17, -4, 9].map((y) => (
          <g key={y}>
            <rect
              x="-25"
              y={y}
              width="50"
              height="9"
              rx="2.5"
              fill="none"
              stroke="currentColor"
            />
            <circle cx="18" cy={y + 4.5} r="1.5" fill="currentColor" />
          </g>
        ))}
      </>
    );
  }

  return (
    <>
      <ellipse cx="0" cy="-13" rx="25" ry="7" fill="none" stroke="currentColor" />
      <path
        d="M-25-13v27c0 4 11 7 25 7s25-3 25-7v-27M-25 0c0 4 11 7 25 7s25-3 25-7"
        fill="none"
        stroke="currentColor"
      />
    </>
  );
}

function DesktopNode({
  x,
  title,
  detail,
  kind,
  active,
}: {
  x: number;
  title: string;
  detail: string;
  kind: NodeKind;
  active: boolean;
}) {
  return (
    <g aria-label={`${title}: ${detail}`}>
      <rect
        x={x - 78}
        y="68"
        width="156"
        height="132"
        rx="14"
        fill={active ? 'color-mix(in srgb, var(--accent) 12%, var(--bg))' : 'var(--bg)'}
        stroke={active ? 'var(--accent)' : 'var(--border)'}
        strokeWidth={active ? '2.5' : '1.5'}
        style={{ transition: 'fill 250ms ease, stroke 250ms ease' }}
      />
      <g transform={`translate(${x} 112)`} strokeWidth="1.8">
        <NodeIcon kind={kind} />
      </g>
      <text
        x={x}
        y="164"
        textAnchor="middle"
        fill="var(--fg)"
        className="text-[12px] font-semibold"
      >
        {title}
      </text>
      <text x={x} y="183" textAnchor="middle" fill="var(--fg-muted)" className="text-[10px]">
        {detail}
      </text>
    </g>
  );
}

function DesktopScene({ step }: { step: number }) {
  const positions = [
    { x: 105, y: 134 },
    { x: 305, y: 118 },
    { x: 360, y: 134 },
    { x: 615, y: 118 },
    { x: 415, y: 156 },
    { x: 105, y: 156 },
  ];
  const packet = positions[step]!;
  const activeKind: NodeKind =
    step <= 1 || step === 5 ? 'browser' : step <= 3 ? 'server' : 'database';

  return (
    <svg
      viewBox="0 0 720 250"
      className="hidden h-full w-full text-[var(--fg)] sm:block"
      role="img"
      aria-label={`${STEPS[step]!.phase}: ${STEPS[step]!.narration}`}
    >
      <defs>
        <marker
          id="flow-arrow-desktop"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto"
        >
          <path d="M0 0 10 5 0 10z" fill="var(--fg-muted)" />
        </marker>
      </defs>

      <rect
        x="270"
        y="16"
        width="180"
        height="30"
        rx="15"
        fill="var(--bg)"
        stroke="var(--border)"
      />
      <text
        x="360"
        y="35"
        textAnchor="middle"
        fill="var(--fg)"
        className="text-[11px] font-semibold"
      >
        {step + 1}. {STEPS[step]!.phase}
      </text>

      <path
        d="M184 118H276M439 118H532"
        fill="none"
        stroke="var(--border)"
        strokeWidth="2"
        markerEnd="url(#flow-arrow-desktop)"
      />
      <path
        d="M532 156H439M276 156H184"
        fill="none"
        stroke="var(--border)"
        strokeWidth="2"
        markerEnd="url(#flow-arrow-desktop)"
      />
      <text x="230" y="106" textAnchor="middle" fill="var(--fg-muted)" className="text-[9px]">
        REQUEST
      </text>
      <text x="490" y="106" textAnchor="middle" fill="var(--fg-muted)" className="text-[9px]">
        QUERY
      </text>
      <text x="490" y="176" textAnchor="middle" fill="var(--fg-muted)" className="text-[9px]">
        ROWS
      </text>
      <text x="230" y="176" textAnchor="middle" fill="var(--fg-muted)" className="text-[9px]">
        RESPONSE
      </text>

      <DesktopNode
        x={105}
        title="Customer's browser"
        detail={step === 5 ? 'renders the catalogue' : 'requests products'}
        kind="browser"
        active={activeKind === 'browser'}
      />
      <DesktopNode
        x={360}
        title="Application server"
        detail={step === 2 ? 'validates and routes' : 'runs application logic'}
        kind="server"
        active={activeKind === 'server'}
      />
      <DesktopNode
        x={615}
        title="Relational database"
        detail={step === 4 ? 'returns matching rows' : 'stores product rows'}
        kind="database"
        active={activeKind === 'database'}
      />

      {step !== 0 && step !== 2 ? (
        <g
          style={{
            transform: `translate(${packet.x}px, ${packet.y}px)`,
            transition: 'transform 650ms ease',
          }}
        >
          <circle r="13" fill="color-mix(in srgb, var(--accent) 18%, var(--bg))" />
          <circle r="6" fill="var(--accent)" />
        </g>
      ) : null}

      <rect
        x="270"
        y="216"
        width="180"
        height="24"
        rx="6"
        fill="color-mix(in srgb, var(--accent) 10%, var(--bg))"
      />
      <text
        x="360"
        y="232"
        textAnchor="middle"
        fill="var(--fg)"
        className="font-mono text-[10px]"
      >
        {STEPS[step]!.payload}
      </text>
    </svg>
  );
}

function MobileNode({
  y,
  title,
  kind,
  active,
}: {
  y: number;
  title: string;
  kind: NodeKind;
  active: boolean;
}) {
  return (
    <g>
      <rect
        x="38"
        y={y}
        width="244"
        height="84"
        rx="12"
        fill={active ? 'color-mix(in srgb, var(--accent) 12%, var(--bg))' : 'var(--bg)'}
        stroke={active ? 'var(--accent)' : 'var(--border)'}
        strokeWidth={active ? '2.5' : '1.5'}
      />
      <g transform={`translate(84 ${y + 42})`} strokeWidth="1.8">
        <NodeIcon kind={kind} />
      </g>
      <text x="128" y={y + 38} fill="var(--fg)" className="text-[13px] font-semibold">
        {title}
      </text>
      <text x="128" y={y + 57} fill="var(--fg-muted)" className="text-[10px]">
        {kind === 'browser'
          ? 'HTTPS client'
          : kind === 'server'
            ? 'Application logic'
            : 'Persistent data'}
      </text>
    </g>
  );
}

function MobileScene({ step }: { step: number }) {
  const activeKind: NodeKind =
    step <= 1 || step === 5 ? 'browser' : step <= 3 ? 'server' : 'database';

  return (
    <svg
      viewBox="0 0 320 430"
      className="h-full w-full text-[var(--fg)] sm:hidden"
      role="img"
      aria-label={`${STEPS[step]!.phase}: ${STEPS[step]!.narration}`}
    >
      <text
        x="160"
        y="25"
        textAnchor="middle"
        fill="var(--fg)"
        className="text-[12px] font-semibold"
      >
        {step + 1}. {STEPS[step]!.phase}
      </text>
      <MobileNode
        y={42}
        title="Customer's browser"
        kind="browser"
        active={activeKind === 'browser'}
      />
      <MobileNode
        y={174}
        title="Application server"
        kind="server"
        active={activeKind === 'server'}
      />
      <MobileNode
        y={306}
        title="Relational database"
        kind="database"
        active={activeKind === 'database'}
      />

      <path
        d="M145 128v38M175 166v-38M145 260v38M175 298v-38"
        stroke="var(--border)"
        strokeWidth="2"
      />
      <path
        d="m140 158 5 8 5-8M170 136l5-8 5 8M140 290l5 8 5-8M170 268l5-8 5 8"
        fill="none"
        stroke="var(--fg-muted)"
        strokeWidth="1.5"
      />

      <rect
        x="76"
        y={step <= 1 ? 140 : step <= 3 ? 272 : step === 4 ? 272 : 140}
        width="168"
        height="24"
        rx="6"
        fill="color-mix(in srgb, var(--accent) 12%, var(--bg))"
      />
      <text
        x="160"
        y={(step <= 1 ? 140 : step <= 3 ? 272 : step === 4 ? 272 : 140) + 16}
        textAnchor="middle"
        fill="var(--fg)"
        className="font-mono text-[10px]"
      >
        {STEPS[step]!.payload}
      </text>
    </svg>
  );
}

export function BasicRequestFlowScene() {
  const playback = usePlayback({ stepCount: STEPS.length, intervalMs: 1900 });

  return (
    <SceneShell playback={playback} narration={NARRATION} label="Request lifecycle">
      <DesktopScene step={playback.step} />
      <MobileScene step={playback.step} />
    </SceneShell>
  );
}
