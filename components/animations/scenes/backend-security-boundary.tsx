'use client';

import { SceneShell } from '../scene-shell';
import { usePlayback } from '../use-playback';

const STEPS = [
  {
    phase: 'Untrusted input',
    payload: 'POST /orders',
    narration:
      'The browser sends order data, but the backend treats every client-supplied value as untrusted.',
    node: 0,
    duty: -1,
  },
  {
    phase: 'Authentication',
    payload: 'Who is calling?',
    narration:
      'The backend verifies the caller’s identity from a secure session or access token.',
    node: 1,
    duty: 0,
  },
  {
    phase: 'Validation',
    payload: 'Is the input valid?',
    narration: 'The backend checks required fields, types, ranges, formats, and size limits.',
    node: 1,
    duty: 1,
  },
  {
    phase: 'Business rules',
    payload: 'May this order proceed?',
    narration:
      'Trusted server-side rules recalculate prices, verify inventory, and authorise the action.',
    node: 1,
    duty: 2,
  },
  {
    phase: 'Database access',
    payload: 'INSERT order',
    narration:
      'Only after the checks pass does the backend read or change durable database state.',
    node: 2,
    duty: -1,
  },
  {
    phase: 'Auditing',
    payload: 'Record outcome',
    narration:
      'The backend records the important actor, action, time, and result for investigation and accountability.',
    node: 1,
    duty: 3,
  },
  {
    phase: 'Controlled response',
    payload: '201 Created',
    narration:
      'The backend returns only the response fields the browser is allowed to receive.',
    node: 0,
    duty: -1,
  },
] as const;

const NARRATION = STEPS.map((step) => step.narration);
const DUTIES = ['Authentication', 'Validation', 'Business rules', 'Auditing'];
const NODES = [
  { title: 'Browser', detail: 'untrusted client', kind: 'browser' },
  { title: 'Backend API', detail: 'controlled boundary', kind: 'backend' },
  { title: 'Database', detail: 'durable private data', kind: 'database' },
] as const;

type NodeKind = (typeof NODES)[number]['kind'];

function NodeIcon({ kind }: { kind: NodeKind }) {
  if (kind === 'browser') {
    return (
      <>
        <rect x="-24" y="-18" width="48" height="34" rx="4" fill="none" />
        <path d="M-24-8h48M-17-13h1M-11-13h1M-5-13h1M-9 22H9M0 16v6" />
      </>
    );
  }

  if (kind === 'backend') {
    return (
      <>
        {[-17, -4, 9].map((y) => (
          <g key={y}>
            <rect x="-25" y={y} width="50" height="9" rx="2.5" fill="none" />
            <circle cx="18" cy={y + 4.5} r="1.5" fill="currentColor" stroke="none" />
            <path d={`M-18 ${y + 4.5}h15`} />
          </g>
        ))}
      </>
    );
  }

  return (
    <>
      <ellipse cx="0" cy="-13" rx="25" ry="7" fill="none" />
      <path
        d="M-25-13v27c0 4 11 7 25 7s25-3 25-7v-27M-25 0c0 4 11 7 25 7s25-3 25-7"
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
  width = 170,
}: {
  x: number;
  y: number;
  index: number;
  active: boolean;
  width?: number;
}) {
  const node = NODES[index]!;

  return (
    <g aria-label={`${node.title}: ${node.detail}`}>
      <rect
        x={x}
        y={y}
        width={width}
        height="100"
        rx="14"
        fill={active ? 'color-mix(in srgb, var(--accent) 13%, var(--bg))' : 'var(--bg)'}
        stroke={active ? 'var(--accent)' : 'var(--border)'}
        strokeWidth={active ? 2.5 : 1.5}
        style={{ transition: 'fill 220ms ease, stroke 220ms ease' }}
      />
      <g
        transform={`translate(${x + width / 2} ${y + 30})`}
        fill="none"
        stroke={active ? 'var(--accent)' : 'var(--fg-muted)'}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <NodeIcon kind={node.kind} />
      </g>
      <text
        x={x + width / 2}
        y={y + 67}
        textAnchor="middle"
        fill="var(--fg)"
        className="text-[12px] font-semibold"
      >
        {node.title}
      </text>
      <text
        x={x + width / 2}
        y={y + 87}
        textAnchor="middle"
        fill="var(--fg-muted)"
        className="text-[9px]"
      >
        {node.detail}
      </text>
    </g>
  );
}

function Duty({
  x,
  y,
  index,
  active,
  width = 135,
}: {
  x: number;
  y: number;
  index: number;
  active: boolean;
  width?: number;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height="30"
        rx="15"
        fill={active ? 'color-mix(in srgb, var(--accent) 15%, var(--bg))' : 'var(--bg)'}
        stroke={active ? 'var(--accent)' : 'var(--border)'}
        strokeWidth={active ? 2 : 1}
      />
      <text
        x={x + width / 2}
        y={y + 19}
        textAnchor="middle"
        fill={active ? 'var(--accent)' : 'var(--fg-muted)'}
        className="text-[9px] font-medium"
      >
        {DUTIES[index]}
      </text>
    </g>
  );
}

function Desktop({ step }: { step: number }) {
  const current = STEPS[step]!;

  return (
    <svg
      viewBox="0 0 740 330"
      className="hidden h-full w-full sm:block"
      role="img"
      aria-label={`${current.phase}: ${current.narration}`}
    >
      <defs>
        <marker
          id="security-arrow"
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
        x="255"
        y="12"
        width="230"
        height="30"
        rx="15"
        fill="var(--bg)"
        stroke="var(--border)"
      />
      <text
        x="370"
        y="32"
        textAnchor="middle"
        fill="var(--fg)"
        className="text-[11px] font-semibold"
      >
        {step + 1}. {current.phase}
      </text>

      <path
        d="M190 111H280M460 111H550"
        stroke="var(--border)"
        strokeWidth="2"
        markerEnd="url(#security-arrow)"
      />
      <path
        d="M550 145H460M280 145H190"
        stroke="var(--border)"
        strokeWidth="2"
        markerEnd="url(#security-arrow)"
      />

      <Node x={20} y={78} index={0} active={current.node === 0} />
      <Node x={285} y={78} index={1} active={current.node === 1} />
      <Node x={550} y={78} index={2} active={current.node === 2} />

      <path d="M370 178V199" stroke="var(--border)" strokeWidth="1.5" />
      {[78, 220, 362, 504].map((x, index) => (
        <Duty key={x} x={x} y={205} index={index} active={current.duty === index} />
      ))}

      <rect
        x="245"
        y="267"
        width="250"
        height="28"
        rx="7"
        fill="color-mix(in srgb, var(--accent) 10%, var(--bg))"
      />
      <text
        x="370"
        y="285"
        textAnchor="middle"
        fill="var(--fg)"
        className="font-mono text-[10px]"
      >
        {current.payload}
      </text>
    </svg>
  );
}

function Mobile({ step }: { step: number }) {
  const current = STEPS[step]!;

  return (
    <svg
      viewBox="0 0 360 650"
      className="h-full w-full sm:hidden"
      role="img"
      aria-label={`${current.phase}: ${current.narration}`}
    >
      <defs>
        <marker
          id="security-arrow-mobile"
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
        x="65"
        y="12"
        width="230"
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
        {step + 1}. {current.phase}
      </text>

      <path
        d="M165 154V172M165 284V396"
        stroke="var(--border)"
        strokeWidth="2"
        markerEnd="url(#security-arrow-mobile)"
      />
      <path
        d="M195 408V290M195 184V160"
        stroke="var(--border)"
        strokeWidth="2"
        markerEnd="url(#security-arrow-mobile)"
      />
      <Node x={85} y={54} width={190} index={0} active={current.node === 0} />
      <Node x={85} y={184} width={190} index={1} active={current.node === 1} />
      <Node x={85} y={408} width={190} index={2} active={current.node === 2} />

      <Duty x={15} y={305} width={140} index={0} active={current.duty === 0} />
      <Duty x={205} y={305} width={140} index={1} active={current.duty === 1} />
      <Duty x={15} y={345} width={140} index={2} active={current.duty === 2} />
      <Duty x={205} y={345} width={140} index={3} active={current.duty === 3} />

      <rect
        x="55"
        y="540"
        width="250"
        height="28"
        rx="7"
        fill="color-mix(in srgb, var(--accent) 10%, var(--bg))"
      />
      <text
        x="180"
        y="558"
        textAnchor="middle"
        fill="var(--fg)"
        className="font-mono text-[9px]"
      >
        {current.payload}
      </text>
      <text x="180" y="603" textAnchor="middle" fill="var(--fg-muted)" className="text-[9px]">
        The browser never connects directly to the database
      </text>
    </svg>
  );
}

export function BackendSecurityBoundaryScene() {
  const playback = usePlayback({ stepCount: STEPS.length });

  return (
    <SceneShell playback={playback} narration={NARRATION} label="Security boundary">
      <Desktop step={playback.step} />
      <Mobile step={playback.step} />
    </SceneShell>
  );
}
