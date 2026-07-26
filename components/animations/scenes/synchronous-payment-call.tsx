'use client';

import { SceneShell } from '../scene-shell';
import { usePlayback } from '../use-playback';

const STEPS = [
  {
    phase: 'Prepare charge',
    payload: '₹3,499 · order-814',
    narration:
      'The checkout API prepares one charge request with an amount and idempotency key.',
    active: 0,
    packet: null,
    waiting: false,
  },
  {
    phase: 'Send request',
    payload: 'POST /charges →',
    narration:
      'Checkout sends the charge request and cannot complete the order until a result arrives.',
    active: 0,
    packet: { x: 370, y: 123 },
    waiting: true,
  },
  {
    phase: 'Process payment',
    payload: 'Authorising payment…',
    narration:
      'The payment provider validates and authorises the charge while checkout remains waiting.',
    active: 1,
    packet: null,
    waiting: true,
  },
  {
    phase: 'Return result',
    payload: '← 200 OK · charge succeeded',
    narration: 'The provider returns a charge result across the response path.',
    active: 1,
    packet: { x: 370, y: 177 },
    waiting: true,
  },
  {
    phase: 'Continue checkout',
    payload: 'Mark order PAID',
    narration:
      'Checkout receives the result, stops waiting, and safely moves the order to PAID.',
    active: 0,
    packet: null,
    waiting: false,
  },
] as const;

const NARRATION = STEPS.map((step) => step.narration);

type NodeKind = 'checkout' | 'payment';

function NodeIcon({ kind }: { kind: NodeKind }) {
  if (kind === 'checkout') {
    return (
      <>
        <rect x="-22" y="-21" width="44" height="42" rx="4" fill="none" />
        <path d="M-13-11h26M-13-2h18M-13 7h14M7 10l4 4 8-9" />
      </>
    );
  }

  return (
    <>
      <rect x="-27" y="-18" width="54" height="36" rx="5" fill="none" />
      <path d="M-27-7h54M-17 8h13M13 3l4 4 7-8" />
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
  waiting = false,
  width = 210,
}: {
  x: number;
  y: number;
  title: string;
  detail: string;
  kind: NodeKind;
  active: boolean;
  waiting?: boolean;
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
        transform={`translate(${x + width / 2} ${y + 33})`}
        fill="none"
        stroke={active ? 'var(--accent)' : 'var(--fg-muted)'}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <NodeIcon kind={kind} />
      </g>
      <text
        x={x + width / 2}
        y={y + 70}
        textAnchor="middle"
        fill="var(--fg)"
        className="text-[12px] font-semibold"
      >
        {title}
      </text>
      <text
        x={x + width / 2}
        y={y + 91}
        textAnchor="middle"
        fill="var(--fg-muted)"
        className="text-[9px]"
      >
        {waiting ? 'waiting for provider…' : detail}
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
      <circle r="13" fill="color-mix(in srgb, var(--accent) 20%, var(--bg))" />
      <circle r="5.5" fill="var(--accent)" />
    </g>
  );
}

function Desktop({ step }: { step: number }) {
  const current = STEPS[step]!;

  return (
    <svg
      viewBox="0 0 740 300"
      className="hidden h-full w-full sm:block"
      role="img"
      aria-label={`${current.phase}: ${current.narration}`}
    >
      <defs>
        <marker
          id="payment-arrow"
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
        d="M245 123H485"
        stroke="var(--border)"
        strokeWidth="2"
        markerEnd="url(#payment-arrow)"
      />
      <path
        d="M485 177H245"
        stroke="var(--border)"
        strokeWidth="2"
        markerEnd="url(#payment-arrow)"
      />
      <text x="365" y="111" textAnchor="middle" fill="var(--fg-muted)" className="text-[9px]">
        CHARGE REQUEST
      </text>
      <text x="365" y="196" textAnchor="middle" fill="var(--fg-muted)" className="text-[9px]">
        CHARGE RESULT
      </text>

      <Node
        x={35}
        y={78}
        title="Checkout API"
        detail="coordinates the order"
        kind="checkout"
        active={current.active === 0}
        waiting={current.waiting}
      />
      <Node
        x={495}
        y={78}
        title="Payment provider"
        detail="authorises the charge"
        kind="payment"
        active={current.active === 1}
      />
      {current.packet ? <Packet x={current.packet.x} y={current.packet.y} /> : null}

      <rect
        x="230"
        y="238"
        width="280"
        height="28"
        rx="7"
        fill="color-mix(in srgb, var(--accent) 10%, var(--bg))"
      />
      <text
        x="370"
        y="256"
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
  const packetPositions = [null, { x: 165, y: 235 }, null, { x: 195, y: 235 }, null];
  const packet = packetPositions[step]!;

  return (
    <svg
      viewBox="0 0 360 535"
      className="h-full w-full sm:hidden"
      role="img"
      aria-label={`${current.phase}: ${current.narration}`}
    >
      <defs>
        <marker
          id="payment-arrow-mobile"
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
        d="M165 166V298"
        stroke="var(--border)"
        strokeWidth="2"
        markerEnd="url(#payment-arrow-mobile)"
      />
      <path
        d="M195 310V178"
        stroke="var(--border)"
        strokeWidth="2"
        markerEnd="url(#payment-arrow-mobile)"
      />
      <text x="148" y="238" textAnchor="end" fill="var(--fg-muted)" className="text-[8px]">
        REQUEST
      </text>
      <text x="212" y="238" fill="var(--fg-muted)" className="text-[8px]">
        RESULT
      </text>

      <Node
        x={75}
        y={54}
        width={210}
        title="Checkout API"
        detail="coordinates the order"
        kind="checkout"
        active={current.active === 0}
        waiting={current.waiting}
      />
      <Node
        x={75}
        y={310}
        width={210}
        title="Payment provider"
        detail="authorises the charge"
        kind="payment"
        active={current.active === 1}
      />
      {packet ? <Packet x={packet.x} y={packet.y} /> : null}

      <rect
        x="40"
        y="455"
        width="280"
        height="28"
        rx="7"
        fill="color-mix(in srgb, var(--accent) 10%, var(--bg))"
      />
      <text
        x="180"
        y="473"
        textAnchor="middle"
        fill="var(--fg)"
        className="font-mono text-[9px]"
      >
        {current.payload}
      </text>
    </svg>
  );
}

export function SynchronousPaymentCallScene() {
  const playback = usePlayback({ stepCount: STEPS.length });

  return (
    <SceneShell playback={playback} narration={NARRATION} label="Synchronous call">
      <Desktop step={playback.step} />
      <Mobile step={playback.step} />
    </SceneShell>
  );
}
