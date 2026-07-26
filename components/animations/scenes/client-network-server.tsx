'use client';

import { SceneShell } from '../scene-shell';
import { usePlayback } from '../use-playback';

const STEPS = [
  {
    phase: 'Client prepares request',
    payload: 'GET /products',
    narration: 'The client creates an HTTP request for the product catalogue.',
    active: 0,
    packet: { x: 125, y: 132 },
  },
  {
    phase: 'Request crosses network',
    payload: 'Encrypted request packets →',
    narration:
      'The network carries encrypted request packets from the client towards the server.',
    active: 1,
    packet: { x: 365, y: 132 },
  },
  {
    phase: 'Server handles request',
    payload: 'Validate → process',
    narration: 'The server receives the packets, reconstructs the request, and processes it.',
    active: 2,
    packet: { x: 615, y: 132 },
  },
  {
    phase: 'Response crosses network',
    payload: '← 200 OK + response packets',
    narration: 'The network carries the server response back to the waiting client.',
    active: 1,
    packet: { x: 365, y: 174 },
  },
  {
    phase: 'Client receives response',
    payload: 'Render products',
    narration: 'The client reconstructs the response and presents the result to the user.',
    active: 0,
    packet: { x: 125, y: 174 },
  },
] as const;

const NARRATION = STEPS.map((step) => step.narration);

type Kind = 'client' | 'network' | 'server';

function Icon({ kind }: { kind: Kind }) {
  if (kind === 'client') {
    return (
      <>
        <rect x="-22" y="-17" width="44" height="31" rx="4" fill="none" />
        <path d="M-22-8h44M-8 20H8M0 14v6" />
      </>
    );
  }

  if (kind === 'network') {
    return (
      <>
        <circle cx="-19" cy="0" r="7" fill="none" />
        <circle cx="19" cy="-12" r="7" fill="none" />
        <circle cx="19" cy="13" r="7" fill="none" />
        <path d="M-12-3 12-10M-12 3l24 8M19-5V6" />
      </>
    );
  }

  return (
    <>
      {[-16, -3, 10].map((y) => (
        <g key={y}>
          <rect x="-23" y={y} width="46" height="9" rx="2" fill="none" />
          <circle cx="16" cy={y + 4.5} r="1.4" fill="currentColor" stroke="none" />
        </g>
      ))}
    </>
  );
}

function Node({
  x,
  y,
  title,
  detail,
  kind,
  active,
  width = 160,
}: {
  x: number;
  y: number;
  title: string;
  detail: string;
  kind: Kind;
  active: boolean;
  width?: number;
}) {
  return (
    <g aria-label={`${title}: ${detail}`}>
      <rect
        x={x}
        y={y}
        width={width}
        height="112"
        rx="14"
        fill={active ? 'color-mix(in srgb, var(--accent) 13%, var(--bg))' : 'var(--bg)'}
        stroke={active ? 'var(--accent)' : 'var(--border)'}
        strokeWidth={active ? 2.5 : 1.5}
        style={{ transition: 'fill 220ms ease, stroke 220ms ease' }}
      />
      <g
        transform={`translate(${x + width / 2} ${y + 37})`}
        fill="none"
        stroke={active ? 'var(--accent)' : 'var(--fg-muted)'}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Icon kind={kind} />
      </g>
      <text
        x={x + width / 2}
        y={y + 78}
        textAnchor="middle"
        fill="var(--fg)"
        className="text-[12px] font-semibold"
      >
        {title}
      </text>
      <text
        x={x + width / 2}
        y={y + 96}
        textAnchor="middle"
        fill="var(--fg-muted)"
        className="text-[9px]"
      >
        {detail}
      </text>
    </g>
  );
}

function Packet({ x, y }: { x: number; y: number }) {
  return (
    <g
      style={{
        transform: `translate(${x}px, ${y}px)`,
        transition: 'transform 650ms ease',
      }}
    >
      <circle r="12" fill="color-mix(in srgb, var(--accent) 20%, var(--bg))" />
      <circle r="5" fill="var(--accent)" />
    </g>
  );
}

function Desktop({ step }: { step: number }) {
  const current = STEPS[step]!;

  return (
    <svg
      viewBox="0 0 740 285"
      className="hidden h-full w-full sm:block"
      role="img"
      aria-label={`${current.phase}: ${current.narration}`}
    >
      <defs>
        <marker
          id="cns-arrow"
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
        y="13"
        width="230"
        height="30"
        rx="15"
        fill="var(--bg)"
        stroke="var(--border)"
      />
      <text
        x="370"
        y="33"
        textAnchor="middle"
        fill="var(--fg)"
        className="text-[11px] font-semibold"
      >
        {step + 1}. {current.phase}
      </text>

      <path
        d="M178 132H282M458 132H562"
        stroke="var(--border)"
        strokeWidth="2"
        markerEnd="url(#cns-arrow)"
      />
      <path
        d="M562 174H458M282 174H178"
        stroke="var(--border)"
        strokeWidth="2"
        markerEnd="url(#cns-arrow)"
      />
      <text x="230" y="120" textAnchor="middle" fill="var(--fg-muted)" className="text-[9px]">
        REQUEST
      </text>
      <text x="510" y="120" textAnchor="middle" fill="var(--fg-muted)" className="text-[9px]">
        REQUEST
      </text>
      <text x="510" y="193" textAnchor="middle" fill="var(--fg-muted)" className="text-[9px]">
        RESPONSE
      </text>
      <text x="230" y="193" textAnchor="middle" fill="var(--fg-muted)" className="text-[9px]">
        RESPONSE
      </text>

      <Node
        x={18}
        y={76}
        title="Client"
        detail="creates and renders"
        kind="client"
        active={current.active === 0}
      />
      <Node
        x={290}
        y={76}
        title="Network"
        detail="transports packets"
        kind="network"
        active={current.active === 1}
      />
      <Node
        x={562}
        y={76}
        title="Server"
        detail="processes requests"
        kind="server"
        active={current.active === 2}
      />
      <Packet x={current.packet.x} y={current.packet.y} />

      <rect
        x="245"
        y="235"
        width="250"
        height="28"
        rx="7"
        fill="color-mix(in srgb, var(--accent) 10%, var(--bg))"
      />
      <text
        x="370"
        y="253"
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
  const packetPositions = [
    { x: 180, y: 110 },
    { x: 165, y: 230 },
    { x: 180, y: 370 },
    { x: 195, y: 230 },
    { x: 180, y: 110 },
  ];
  const packet = packetPositions[step]!;

  return (
    <svg
      viewBox="0 0 360 540"
      className="h-full w-full sm:hidden"
      role="img"
      aria-label={`${current.phase}: ${current.narration}`}
    >
      <defs>
        <marker
          id="cns-arrow-mobile"
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
        d="M165 166V178M165 296V308"
        stroke="var(--border)"
        strokeWidth="2"
        markerEnd="url(#cns-arrow-mobile)"
      />
      <path
        d="M195 314V302M195 184V172"
        stroke="var(--border)"
        strokeWidth="2"
        markerEnd="url(#cns-arrow-mobile)"
      />
      <Node
        x={90}
        y={54}
        width={180}
        title="Client"
        detail="creates and renders"
        kind="client"
        active={current.active === 0}
      />
      <Node
        x={90}
        y={184}
        width={180}
        title="Network"
        detail="transports packets"
        kind="network"
        active={current.active === 1}
      />
      <Node
        x={90}
        y={314}
        width={180}
        title="Server"
        detail="processes requests"
        kind="server"
        active={current.active === 2}
      />
      <Packet x={packet.x} y={packet.y} />

      <rect
        x="55"
        y="454"
        width="250"
        height="28"
        rx="7"
        fill="color-mix(in srgb, var(--accent) 10%, var(--bg))"
      />
      <text
        x="180"
        y="472"
        textAnchor="middle"
        fill="var(--fg)"
        className="font-mono text-[9px]"
      >
        {current.payload}
      </text>
      <text x="180" y="510" textAnchor="middle" fill="var(--fg-muted)" className="text-[9px]">
        Request travels down · Response travels up
      </text>
    </svg>
  );
}

export function ClientNetworkServerScene() {
  const playback = usePlayback({ stepCount: STEPS.length });

  return (
    <SceneShell playback={playback} narration={NARRATION} label="Packet flow">
      <Desktop step={playback.step} />
      <Mobile step={playback.step} />
    </SceneShell>
  );
}
