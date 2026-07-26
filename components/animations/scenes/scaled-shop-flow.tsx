'use client';

import { SceneShell } from '../scene-shell';
import { usePlayback } from '../use-playback';

const STEPS = [
  {
    phase: 'Order request',
    payload: 'POST /orders',
    narration: 'The browser sends a new order request over HTTPS.',
  },
  {
    phase: 'Traffic routing',
    payload: 'Choose a healthy server',
    narration: 'The load balancer routes the request to one healthy application server.',
  },
  {
    phase: 'Application logic',
    payload: 'Validate order',
    narration: 'The selected application server validates the basket and calculates the total.',
  },
  {
    phase: 'Durable write',
    payload: 'INSERT order',
    narration: 'The application server stores the order in the primary database.',
  },
  {
    phase: 'Replication',
    payload: 'Copy committed data',
    narration: 'The database asynchronously copies the committed order to a read replica.',
  },
  {
    phase: 'Queue background work',
    payload: 'OrderConfirmed',
    narration:
      'The application server—not the read replica—publishes a confirmation job without waiting for email delivery.',
  },
  {
    phase: 'Independent completion',
    payload: '201 Created  ∥  Send email',
    narration:
      'Two independent paths now continue: the application responds to the browser while the email worker consumes the queued job.',
  },
];

const NARRATION = STEPS.map((step) => step.narration);

type NodeId = 'browser' | 'balancer' | 'apps' | 'database' | 'replica' | 'queue' | 'worker';

const ACTIVE_NODES: NodeId[][] = [
  ['browser'],
  ['balancer'],
  ['apps'],
  ['database'],
  ['replica'],
  ['queue'],
  ['browser', 'worker'],
];

function MiniIcon({ kind }: { kind: NodeId }) {
  if (kind === 'browser') {
    return (
      <>
        <rect x="-18" y="-14" width="36" height="27" rx="3" fill="none" stroke="currentColor" />
        <path d="M-18-6h36M-7 18h14" stroke="currentColor" />
      </>
    );
  }

  if (kind === 'database' || kind === 'replica') {
    return (
      <>
        <ellipse cx="0" cy="-10" rx="18" ry="6" fill="none" stroke="currentColor" />
        <path
          d="M-18-10v21c0 4 8 6 18 6s18-2 18-6v-21M-18 1c0 4 8 6 18 6s18-2 18-6"
          fill="none"
          stroke="currentColor"
        />
      </>
    );
  }

  if (kind === 'balancer') {
    return (
      <>
        <circle cx="-17" cy="0" r="5" fill="none" stroke="currentColor" />
        <circle cx="17" cy="-12" r="5" fill="none" stroke="currentColor" />
        <circle cx="17" cy="12" r="5" fill="none" stroke="currentColor" />
        <path d="M-12 0H0m0 0 12-12M0 0l12 12" fill="none" stroke="currentColor" />
      </>
    );
  }

  if (kind === 'apps') {
    return (
      <>
        {[-13, 0, 13].map((y) => (
          <g key={y}>
            <rect
              x="-20"
              y={y - 4}
              width="40"
              height="8"
              rx="2"
              fill="none"
              stroke="currentColor"
            />
            <circle cx="14" cy={y} r="1.3" fill="currentColor" />
          </g>
        ))}
      </>
    );
  }

  if (kind === 'queue') {
    return (
      <>
        {[-14, 0, 14].map((x) => (
          <rect
            key={x}
            x={x - 5}
            y="-7"
            width="10"
            height="14"
            rx="2"
            fill="none"
            stroke="currentColor"
          />
        ))}
      </>
    );
  }

  return (
    <>
      <path d="M-17 5h34M-12 5V-7h24V5M-6-7v-7h12v7" fill="none" stroke="currentColor" />
      <path d="m-4 0 4 4 8-10" fill="none" stroke="currentColor" strokeWidth="2" />
    </>
  );
}

function DesktopNode({
  id,
  x,
  y,
  width,
  title,
  detail,
  active,
}: {
  id: NodeId;
  x: number;
  y: number;
  width: number;
  title: string;
  detail: string;
  active: boolean;
}) {
  return (
    <g>
      <rect
        x={x - width / 2}
        y={y - 43}
        width={width}
        height="86"
        rx="12"
        fill={active ? 'color-mix(in srgb, var(--accent) 12%, var(--bg))' : 'var(--bg)'}
        stroke={active ? 'var(--accent)' : 'var(--border)'}
        strokeWidth={active ? '2.5' : '1.5'}
        style={{ transition: 'fill 250ms ease, stroke 250ms ease' }}
      />
      <g transform={`translate(${x} ${y - 13})`} strokeWidth="1.7">
        <MiniIcon kind={id} />
      </g>
      <text
        x={x}
        y={y + 19}
        textAnchor="middle"
        fill="var(--fg)"
        className="text-[10px] font-semibold"
      >
        {title}
      </text>
      <text x={x} y={y + 34} textAnchor="middle" fill="var(--fg-muted)" className="text-[8px]">
        {detail}
      </text>
    </g>
  );
}

function DesktopScene({ step }: { step: number }) {
  const active = ACTIVE_NODES[step]!;
  const activePath = [
    '',
    'M116 124H139',
    'M231 124H256',
    'M374 108 416 89',
    'M534 87H587',
    'M374 150 433 188',
    'M256 151H231M139 151H116M567 196H596',
  ][step]!;
  const packets = [
    [],
    [{ x: 139, y: 124 }],
    [{ x: 256, y: 124 }],
    [{ x: 416, y: 89 }],
    [{ x: 587, y: 87 }],
    [{ x: 433, y: 188 }],
    [
      { x: 116, y: 151 },
      { x: 596, y: 196 },
    ],
  ][step];

  return (
    <svg
      viewBox="0 0 760 285"
      className="hidden h-full w-full text-[var(--fg)] sm:block"
      role="img"
      aria-label={`${STEPS[step]!.phase}: ${STEPS[step]!.narration}`}
    >
      <defs>
        <marker
          id="scaled-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto"
        >
          <path d="M0 0 10 5 0 10z" fill="var(--fg-muted)" />
        </marker>
        <marker
          id="scaled-arrow-active"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto"
        >
          <path d="M0 0 10 5 0 10z" fill="var(--accent)" />
        </marker>
      </defs>

      <rect
        x="278"
        y="12"
        width="204"
        height="29"
        rx="15"
        fill="var(--bg)"
        stroke="var(--border)"
      />
      <text
        x="380"
        y="31"
        textAnchor="middle"
        fill="var(--fg)"
        className="text-[11px] font-semibold"
      >
        {step + 1}. {STEPS[step]!.phase}
      </text>

      <g fill="none" stroke="var(--border)" strokeWidth="1.8" markerEnd="url(#scaled-arrow)">
        <path d="M116 124H139" />
        <path d="M231 124H256" />
        <path d="M374 108 416 89" />
        <path d="M534 87H587" />
        <path d="M374 150 433 188" />
        <path d="M567 196H596" />
      </g>
      <path
        d="M256 151H231M139 151H116"
        fill="none"
        stroke="var(--border)"
        strokeWidth="1.8"
        markerEnd="url(#scaled-arrow)"
      />
      {activePath ? (
        <path
          d={activePath}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3"
          markerEnd="url(#scaled-arrow-active)"
        />
      ) : null}

      <DesktopNode
        id="browser"
        x={65}
        y={137}
        width={102}
        title="Browser"
        detail="customer request"
        active={active.includes('browser')}
      />
      <DesktopNode
        id="balancer"
        x={185}
        y={137}
        width={92}
        title="Load balancer"
        detail="healthy routing"
        active={active.includes('balancer')}
      />
      <DesktopNode
        id="apps"
        x={315}
        y={137}
        width={118}
        title="Application servers"
        detail="stateless replicas"
        active={active.includes('apps')}
      />
      <DesktopNode
        id="database"
        x={475}
        y={87}
        width={118}
        title="Database"
        detail="primary writes"
        active={active.includes('database')}
      />
      <DesktopNode
        id="replica"
        x={650}
        y={87}
        width={126}
        title="Read replica"
        detail="serves reads"
        active={active.includes('replica')}
      />
      <DesktopNode
        id="queue"
        x={500}
        y={196}
        width={134}
        title="Message queue"
        detail="durable jobs"
        active={active.includes('queue')}
      />
      <DesktopNode
        id="worker"
        x={655}
        y={196}
        width={118}
        title="Email worker"
        detail="background work"
        active={active.includes('worker')}
      />

      {packets?.map((packet) => (
        <g
          key={`${step}-${packet.x}-${packet.y}`}
          transform={`translate(${packet.x} ${packet.y})`}
        >
          <circle r="13" fill="color-mix(in srgb, var(--accent) 18%, var(--bg))" />
          <circle r="6" fill="var(--accent)" />
        </g>
      ))}

      <rect
        x="280"
        y="251"
        width="200"
        height="23"
        rx="6"
        fill="color-mix(in srgb, var(--accent) 10%, var(--bg))"
      />
      <text
        x="380"
        y="267"
        textAnchor="middle"
        fill="var(--fg)"
        className="font-mono text-[10px]"
      >
        {STEPS[step]!.payload}
      </text>
    </svg>
  );
}

function MobileBox({
  id,
  x,
  y,
  width,
  title,
  active,
}: {
  id: NodeId;
  x: number;
  y: number;
  width: number;
  title: string;
  active: boolean;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height="76"
        rx="11"
        fill={active ? 'color-mix(in srgb, var(--accent) 12%, var(--bg))' : 'var(--bg)'}
        stroke={active ? 'var(--accent)' : 'var(--border)'}
        strokeWidth={active ? '2.3' : '1.4'}
      />
      <g transform={`translate(${x + 31} ${y + 32})`} strokeWidth="1.5">
        <MiniIcon kind={id} />
      </g>
      <text x={x + 59} y={y + 37} fill="var(--fg)" className="text-[10px] font-semibold">
        {title}
      </text>
      <text x={x + 59} y={y + 54} fill="var(--fg-muted)" className="text-[8px]">
        {id === 'database'
          ? 'writes'
          : id === 'replica'
            ? 'reads'
            : id === 'queue'
              ? 'jobs'
              : id === 'worker'
                ? 'email'
                : 'request path'}
      </text>
    </g>
  );
}

function MobileScene({ step }: { step: number }) {
  const active = ACTIVE_NODES[step]!;
  const activePath = [
    '',
    'M170 112v28',
    'M170 216v28',
    'M170 320 92 344',
    'M92 420v24',
    'M170 320 248 344',
    'M170 244v-28M170 140v-28M248 420v24',
  ][step]!;

  return (
    <svg
      viewBox="0 0 340 590"
      className="h-full w-full text-[var(--fg)] sm:hidden"
      role="img"
      aria-label={`${STEPS[step]!.phase}: ${STEPS[step]!.narration}`}
    >
      <text
        x="170"
        y="23"
        textAnchor="middle"
        fill="var(--fg)"
        className="text-[11px] font-semibold"
      >
        {step + 1}. {STEPS[step]!.phase}
      </text>

      <path
        d="M170 112v28M170 216v28M170 320v24M92 420v24M248 420v24"
        stroke="var(--border)"
        strokeWidth="2"
      />
      <path
        d="M170 320 92 344M170 320l78 24"
        stroke="var(--border)"
        strokeWidth="2"
        fill="none"
      />
      {activePath ? (
        <path d={activePath} stroke="var(--accent)" strokeWidth="3" fill="none" />
      ) : null}
      <text x="83" y="337" textAnchor="middle" fill="var(--fg-muted)" className="text-[8px]">
        DATA
      </text>
      <text x="260" y="337" textAnchor="middle" fill="var(--fg-muted)" className="text-[8px]">
        BACKGROUND
      </text>

      <MobileBox
        id="browser"
        x={44}
        y={36}
        width={252}
        title="Browser"
        active={active.includes('browser')}
      />
      <MobileBox
        id="balancer"
        x={44}
        y={140}
        width={252}
        title="Load balancer"
        active={active.includes('balancer')}
      />
      <MobileBox
        id="apps"
        x={44}
        y={244}
        width={252}
        title="Application servers"
        active={active.includes('apps')}
      />
      <MobileBox
        id="database"
        x={20}
        y={344}
        width={144}
        title="Database"
        active={active.includes('database')}
      />
      <MobileBox
        id="queue"
        x={176}
        y={344}
        width={144}
        title="Message queue"
        active={active.includes('queue')}
      />
      <MobileBox
        id="replica"
        x={20}
        y={444}
        width={144}
        title="Read replica"
        active={active.includes('replica')}
      />
      <MobileBox
        id="worker"
        x={176}
        y={444}
        width={144}
        title="Email worker"
        active={active.includes('worker')}
      />

      <rect
        x="70"
        y="540"
        width="200"
        height="25"
        rx="6"
        fill="color-mix(in srgb, var(--accent) 10%, var(--bg))"
      />
      <text
        x="170"
        y="557"
        textAnchor="middle"
        fill="var(--fg)"
        className="font-mono text-[10px]"
      >
        {STEPS[step]!.payload}
      </text>
    </svg>
  );
}

export function ScaledShopFlowScene() {
  const playback = usePlayback({ stepCount: STEPS.length, intervalMs: 1900 });

  return (
    <SceneShell playback={playback} narration={NARRATION} label="Scaled request flow">
      <DesktopScene step={playback.step} />
      <MobileScene step={playback.step} />
    </SceneShell>
  );
}
