'use client';

import { SceneShell } from '../scene-shell';
import { usePlayback } from '../use-playback';

const STEPS = [
  {
    phase: 'User action',
    payload: 'Open /products',
    narration: 'The customer asks the browser to open the product catalogue.',
    active: 0,
  },
  {
    phase: 'Network request',
    payload: 'HTTPS GET /products',
    narration: 'The browser sends an encrypted request across the network to the shop.',
    active: 1,
  },
  {
    phase: 'Frontend delivery',
    payload: 'HTML + CSS + JavaScript',
    narration:
      'The frontend files give the browser the page structure, appearance, and behaviour.',
    active: 2,
  },
  {
    phase: 'API call',
    payload: 'GET /api/products',
    narration:
      'Frontend code calls a backend API because the current product data lives on the server.',
    active: 3,
  },
  {
    phase: 'Database query',
    payload: 'SELECT available products',
    narration:
      'The backend validates the request and asks the database for available products.',
    active: 4,
  },
  {
    phase: 'API response',
    payload: '200 OK + JSON',
    narration:
      'The database result travels back through the backend as a structured API response.',
    active: 3,
  },
  {
    phase: 'Render',
    payload: 'Product cards',
    narration:
      'The frontend updates the page, and the browser paints product cards for the customer.',
    active: 0,
  },
] as const;

const NARRATION = STEPS.map((step) => step.narration);
const NODES = [
  { title: 'Browser', detail: 'runs the interface', kind: 'browser' },
  { title: 'Network', detail: 'moves messages', kind: 'network' },
  { title: 'Frontend', detail: 'presents the page', kind: 'frontend' },
  { title: 'Backend API', detail: 'applies business rules', kind: 'backend' },
  { title: 'Database', detail: 'stores durable data', kind: 'database' },
] as const;

type NodeKind = (typeof NODES)[number]['kind'];

function NodeIcon({ kind }: { kind: NodeKind }) {
  if (kind === 'browser' || kind === 'frontend') {
    return (
      <>
        <rect x="-21" y="-16" width="42" height="29" rx="3.5" fill="none" />
        {kind === 'browser' ? (
          <path d="M-21-7h42M-14-12h1M-8-12h1M-7 19H7M0 13v6" />
        ) : (
          <path d="M-11-7h22M-11 0h9M2 0h9M-11 7h22" />
        )}
      </>
    );
  }
  if (kind === 'network') {
    return (
      <>
        <circle cx="-18" cy="0" r="6" fill="none" />
        <circle cx="18" cy="-11" r="6" fill="none" />
        <circle cx="18" cy="12" r="6" fill="none" />
        <path d="M-12-2 12-9M-12 2l24 8M18-5V6" />
      </>
    );
  }
  if (kind === 'backend') {
    return (
      <>
        {[-14, -2, 10].map((y) => (
          <g key={y}>
            <rect x="-22" y={y} width="44" height="8" rx="2" fill="none" />
            <circle cx="15" cy={y + 4} r="1.3" fill="currentColor" stroke="none" />
          </g>
        ))}
      </>
    );
  }
  return (
    <>
      <ellipse cx="0" cy="-10" rx="21" ry="6" fill="none" />
      <path
        d="M-21-10v21c0 4 9 6 21 6s21-2 21-6v-21M-21 0c0 4 9 6 21 6s21-2 21-6"
        fill="none"
      />
    </>
  );
}

function Node({
  x,
  y,
  index,
  active,
  compact = false,
}: {
  x: number;
  y: number;
  index: number;
  active: boolean;
  compact?: boolean;
}) {
  const node = NODES[index]!;
  const width = compact ? 150 : 108;
  const height = compact ? 84 : 100;

  return (
    <g aria-label={`${node.title}: ${node.detail}`}>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx="13"
        fill={active ? 'color-mix(in srgb, var(--accent) 13%, var(--bg))' : 'var(--bg)'}
        stroke={active ? 'var(--accent)' : 'var(--border)'}
        strokeWidth={active ? 2.5 : 1.5}
        style={{ transition: 'fill 220ms ease, stroke 220ms ease' }}
      />
      <g
        transform={`translate(${x + width / 2} ${y + (compact ? 25 : 27)})`}
        fill="none"
        stroke={active ? 'var(--accent)' : 'var(--fg-muted)'}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <NodeIcon kind={node.kind} />
      </g>
      <text
        x={x + width / 2}
        y={y + (compact ? 55 : 63)}
        textAnchor="middle"
        fill="var(--fg)"
        className="text-[11px] font-semibold"
      >
        {node.title}
      </text>
      <text
        x={x + width / 2}
        y={y + (compact ? 73 : 82)}
        textAnchor="middle"
        fill="var(--fg-muted)"
        className="text-[9px]"
      >
        {node.detail}
      </text>
    </g>
  );
}

function Desktop({ step }: { step: number }) {
  const positions = [10, 165, 320, 475, 630];
  const requestEdge = step >= 1 && step <= 4 ? step - 1 : -1;
  const responseEdges = step === 5 ? [2, 3] : step === 6 ? [0, 1] : [];

  return (
    <svg
      viewBox="0 0 740 245"
      className="hidden h-full w-full sm:block"
      role="img"
      aria-label={`${STEPS[step]!.phase}: ${STEPS[step]!.narration}`}
    >
      <defs>
        <marker
          id="software-arrow"
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
        width="200"
        height="30"
        rx="15"
        fill="var(--bg)"
        stroke="var(--border)"
      />
      <text
        x="370"
        y="35"
        textAnchor="middle"
        fill="var(--fg)"
        className="text-[11px] font-semibold"
      >
        {step + 1}. {STEPS[step]!.phase}
      </text>

      {positions.slice(0, -1).map((x, index) => (
        <g key={x}>
          <path
            d={`M${x + 108} 105H${positions[index + 1]! - 10}`}
            stroke={requestEdge === index ? 'var(--accent)' : 'var(--border)'}
            strokeWidth="2"
            markerEnd="url(#software-arrow)"
          />
          <path
            d={`M${positions[index + 1]!} 150H${x + 118}`}
            stroke={responseEdges.includes(index) ? 'var(--accent)' : 'var(--border)'}
            strokeWidth="2"
            markerEnd="url(#software-arrow)"
          />
        </g>
      ))}
      {positions.map((x, index) => (
        <Node key={x} x={x} y={70} index={index} active={STEPS[step]!.active === index} />
      ))}

      <rect
        x="255"
        y="187"
        width="230"
        height="28"
        rx="7"
        fill="color-mix(in srgb, var(--accent) 10%, var(--bg))"
      />
      <text
        x="370"
        y="205"
        textAnchor="middle"
        fill="var(--fg)"
        className="font-mono text-[10px]"
      >
        {STEPS[step]!.payload}
      </text>
    </svg>
  );
}

function Mobile({ step }: { step: number }) {
  const positions = [54, 162, 270, 378, 486];
  const requestEdge = step >= 1 && step <= 4 ? step - 1 : -1;
  const responseEdges = step === 5 ? [2, 3] : step === 6 ? [0, 1] : [];

  return (
    <svg
      viewBox="0 0 360 670"
      className="h-full w-full sm:hidden"
      role="img"
      aria-label={`${STEPS[step]!.phase}: ${STEPS[step]!.narration}`}
    >
      <defs>
        <marker
          id="software-arrow-mobile"
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
        x="80"
        y="12"
        width="200"
        height="28"
        rx="14"
        fill="var(--bg)"
        stroke="var(--border)"
      />
      <text
        x="180"
        y="30"
        textAnchor="middle"
        fill="var(--fg)"
        className="text-[10px] font-semibold"
      >
        {step + 1}. {STEPS[step]!.phase}
      </text>
      {positions.slice(0, -1).map((y, index) => (
        <g key={y}>
          <path
            d={`M165 ${y + 84}V${positions[index + 1]! - 6}`}
            stroke={requestEdge === index ? 'var(--accent)' : 'var(--border)'}
            strokeWidth="2"
            markerEnd="url(#software-arrow-mobile)"
          />
          <path
            d={`M195 ${positions[index + 1]!}V${y + 90}`}
            stroke={responseEdges.includes(index) ? 'var(--accent)' : 'var(--border)'}
            strokeWidth="2"
            markerEnd="url(#software-arrow-mobile)"
          />
        </g>
      ))}
      {positions.map((y, index) => (
        <Node
          key={y}
          x={105}
          y={y}
          index={index}
          active={STEPS[step]!.active === index}
          compact
        />
      ))}
      <rect
        x="70"
        y="595"
        width="220"
        height="28"
        rx="7"
        fill="color-mix(in srgb, var(--accent) 10%, var(--bg))"
      />
      <text
        x="180"
        y="613"
        textAnchor="middle"
        fill="var(--fg)"
        className="font-mono text-[9px]"
      >
        {STEPS[step]!.payload}
      </text>
    </svg>
  );
}

export function SoftwareRequestLifecycleScene() {
  const playback = usePlayback({ stepCount: STEPS.length });

  return (
    <SceneShell playback={playback} narration={NARRATION} label="Request lifecycle">
      <Desktop step={playback.step} />
      <Mobile step={playback.step} />
    </SceneShell>
  );
}
