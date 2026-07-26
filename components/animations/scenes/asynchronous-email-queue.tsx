'use client';

import { SceneShell } from '../scene-shell';
import { usePlayback } from '../use-playback';

const STEPS = [
  {
    phase: 'Order created',
    payload: 'order-814 · PAID',
    narration: 'The Order service commits the order before requesting any email work.',
    active: 0,
    packet: null,
    queueDepth: 0,
    orderDone: false,
  },
  {
    phase: 'Publish event',
    payload: 'OrderConfirmed event →',
    narration: 'The Order service publishes a small OrderConfirmed message to the queue.',
    active: 0,
    packet: { x: 260, y: 132 },
    queueDepth: 0,
    orderDone: false,
  },
  {
    phase: 'Queue accepts',
    payload: 'Message stored durably',
    narration:
      'The queue stores the message and acknowledges it; the email does not need to be sent yet.',
    active: 1,
    packet: null,
    queueDepth: 1,
    orderDone: false,
  },
  {
    phase: 'Order completes',
    payload: '201 Created · no waiting',
    narration:
      'The Order service can respond successfully while the queued email work remains pending.',
    active: 0,
    packet: null,
    queueDepth: 1,
    orderDone: true,
  },
  {
    phase: 'Worker consumes',
    payload: 'Deliver OrderConfirmed →',
    narration:
      'When ready, the Email worker independently consumes the message from the queue.',
    active: 2,
    packet: { x: 500, y: 132 },
    queueDepth: 0,
    orderDone: true,
  },
  {
    phase: 'Email sent',
    payload: 'Confirmation delivered',
    narration:
      'The worker sends the confirmation and acknowledges completion; failures can be retried without reopening checkout.',
    active: 2,
    packet: null,
    queueDepth: 0,
    orderDone: true,
  },
] as const;

const NARRATION = STEPS.map((step) => step.narration);
const NODES = [
  { title: 'Order service', detail: 'creates the order', kind: 'order' },
  { title: 'Message queue', detail: 'buffers durable work', kind: 'queue' },
  { title: 'Email worker', detail: 'sends confirmations', kind: 'worker' },
] as const;

type NodeKind = (typeof NODES)[number]['kind'];

function NodeIcon({ kind }: { kind: NodeKind }) {
  if (kind === 'order') {
    return (
      <>
        <rect x="-22" y="-21" width="44" height="42" rx="4" fill="none" />
        <path d="M-13-11h26M-13-2h18M-13 7h14M7 10l4 4 8-9" />
      </>
    );
  }

  if (kind === 'queue') {
    return (
      <>
        {[-16, -2, 12].map((y) => (
          <g key={y}>
            <rect x="-25" y={y} width="50" height="10" rx="3" fill="none" />
            <circle cx="-17" cy={y + 5} r="1.5" fill="currentColor" stroke="none" />
            <path d={`M-10 ${y + 5}h27`} />
          </g>
        ))}
      </>
    );
  }

  return (
    <>
      <rect x="-26" y="-18" width="52" height="36" rx="5" fill="none" />
      <path d="m-19-10 19 14 19-14" />
      <circle cx="19" cy="14" r="8" fill="var(--bg)" />
      <path d="M19 10v8M15 14h8" />
    </>
  );
}

function Node({
  x,
  y,
  index,
  active,
  badge,
  width = 170,
}: {
  x: number;
  y: number;
  index: number;
  active: boolean;
  badge?: string;
  width?: number;
}) {
  const node = NODES[index]!;

  return (
    <g aria-label={`${node.title}: ${node.detail}`}>
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
        transform={`translate(${x + width / 2} ${y + 33})`}
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
        y={y + 70}
        textAnchor="middle"
        fill="var(--fg)"
        className="text-[12px] font-semibold"
      >
        {node.title}
      </text>
      <text
        x={x + width / 2}
        y={y + 91}
        textAnchor="middle"
        fill="var(--fg-muted)"
        className="text-[9px]"
      >
        {node.detail}
      </text>
      {badge ? (
        <>
          <rect
            x={x + width - 46}
            y={y - 9}
            width="44"
            height="20"
            rx="10"
            fill="var(--accent)"
          />
          <text
            x={x + width - 24}
            y={y + 5}
            textAnchor="middle"
            fill="var(--accent-fg)"
            className="text-[8px] font-semibold"
          >
            {badge}
          </text>
        </>
      ) : null}
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
      <rect
        x="-13"
        y="-10"
        width="26"
        height="20"
        rx="5"
        fill="color-mix(in srgb, var(--accent) 20%, var(--bg))"
        stroke="var(--accent)"
      />
      <path d="m-8-5 8 6 8-6" fill="none" stroke="var(--accent)" strokeWidth="1.5" />
    </g>
  );
}

function Desktop({ step }: { step: number }) {
  const current = STEPS[step]!;

  return (
    <svg
      viewBox="0 0 740 310"
      className="hidden h-full w-full sm:block"
      role="img"
      aria-label={`${current.phase}: ${current.narration}`}
    >
      <defs>
        <marker
          id="queue-arrow"
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
        d="M190 132H280M460 132H550"
        stroke="var(--border)"
        strokeWidth="2"
        markerEnd="url(#queue-arrow)"
      />
      <text x="235" y="119" textAnchor="middle" fill="var(--fg-muted)" className="text-[9px]">
        PUBLISH
      </text>
      <text x="505" y="119" textAnchor="middle" fill="var(--fg-muted)" className="text-[9px]">
        CONSUME
      </text>

      <Node
        x={20}
        y={76}
        index={0}
        active={current.active === 0}
        badge={current.orderDone ? 'DONE' : undefined}
      />
      <Node
        x={285}
        y={76}
        index={1}
        active={current.active === 1}
        badge={current.queueDepth ? '1 JOB' : undefined}
      />
      <Node x={550} y={76} index={2} active={current.active === 2} />
      {current.packet ? <Packet x={current.packet.x} y={current.packet.y} /> : null}

      <rect
        x="230"
        y="231"
        width="280"
        height="28"
        rx="7"
        fill="color-mix(in srgb, var(--accent) 10%, var(--bg))"
      />
      <text
        x="370"
        y="249"
        textAnchor="middle"
        fill="var(--fg)"
        className="font-mono text-[10px]"
      >
        {current.payload}
      </text>
      <text x="370" y="283" textAnchor="middle" fill="var(--fg-muted)" className="text-[9px]">
        Order completion and email delivery are independent
      </text>
    </svg>
  );
}

function Mobile({ step }: { step: number }) {
  const current = STEPS[step]!;
  const packetPositions = [null, { x: 180, y: 175 }, null, null, { x: 180, y: 330 }, null];
  const packet = packetPositions[step]!;

  return (
    <svg
      viewBox="0 0 360 625"
      className="h-full w-full sm:hidden"
      role="img"
      aria-label={`${current.phase}: ${current.narration}`}
    >
      <defs>
        <marker
          id="queue-arrow-mobile"
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
        d="M180 166V188M180 318V340"
        stroke="var(--border)"
        strokeWidth="2"
        markerEnd="url(#queue-arrow-mobile)"
      />
      <Node
        x={85}
        y={54}
        width={190}
        index={0}
        active={current.active === 0}
        badge={current.orderDone ? 'DONE' : undefined}
      />
      <Node
        x={85}
        y={206}
        width={190}
        index={1}
        active={current.active === 1}
        badge={current.queueDepth ? '1 JOB' : undefined}
      />
      <Node x={85} y={358} width={190} index={2} active={current.active === 2} />
      {packet ? <Packet x={packet.x} y={packet.y} /> : null}

      <rect
        x="40"
        y="508"
        width="280"
        height="28"
        rx="7"
        fill="color-mix(in srgb, var(--accent) 10%, var(--bg))"
      />
      <text
        x="180"
        y="526"
        textAnchor="middle"
        fill="var(--fg)"
        className="font-mono text-[9px]"
      >
        {current.payload}
      </text>
      <text x="180" y="567" textAnchor="middle" fill="var(--fg-muted)" className="text-[9px]">
        The order does not wait for email delivery
      </text>
    </svg>
  );
}

export function AsynchronousEmailQueueScene() {
  const playback = usePlayback({ stepCount: STEPS.length });

  return (
    <SceneShell playback={playback} narration={NARRATION} label="Asynchronous flow">
      <Desktop step={playback.step} />
      <Mobile step={playback.step} />
    </SceneShell>
  );
}
