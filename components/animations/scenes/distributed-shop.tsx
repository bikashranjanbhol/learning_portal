'use client';

import { SceneShell } from '../scene-shell';
import { usePlayback } from '../use-playback';

const STEPS = [
  {
    phase: 'Browse request',
    payload: 'GET /products',
    narration: 'The Web client sends a product request to the system’s public API gateway.',
    node: 'client',
    edges: ['client-gateway'],
  },
  {
    phase: 'Route catalogue',
    payload: 'Gateway → Catalogue',
    narration:
      'The gateway authenticates and routes the request to the independently deployed Catalogue service.',
    node: 'gateway',
    edges: ['client-gateway', 'gateway-catalogue'],
  },
  {
    phase: 'Process catalogue',
    payload: 'Catalogue.listProducts()',
    narration:
      'The Catalogue service applies its product rules before accessing its private storage.',
    node: 'catalogue',
    edges: ['gateway-catalogue'],
  },
  {
    phase: 'Read products',
    payload: 'SELECT products',
    narration: 'The Catalogue service reads from the Product database that it owns.',
    node: 'product-db',
    edges: ['gateway-catalogue', 'catalogue-product'],
  },
  {
    phase: 'Create order',
    payload: 'POST /orders',
    narration:
      'A checkout request enters through the same gateway and is routed to the Order service.',
    node: 'order',
    edges: ['client-gateway', 'gateway-order'],
  },
  {
    phase: 'Persist order',
    payload: 'INSERT order · PENDING',
    narration: 'The Order service writes the new order to its own Order database.',
    node: 'order-db',
    edges: ['gateway-order', 'order-db'],
  },
  {
    phase: 'Request payment',
    payload: 'Order → Payment service',
    narration:
      'The Order service calls the internal Payment service; the gateway is not part of this service-to-service call.',
    node: 'payment',
    edges: ['order-payment'],
  },
  {
    phase: 'Charge provider',
    payload: 'POST /charges',
    narration:
      'The Payment service calls the external payment provider and waits for an authorisation result.',
    node: 'provider',
    edges: ['order-payment', 'payment-provider'],
  },
  {
    phase: 'Complete order',
    payload: 'Order · PAID',
    narration:
      'After payment succeeds, the Order service updates its database and returns the result through the gateway.',
    node: 'order',
    edges: ['payment-provider', 'order-payment', 'order-db', 'gateway-order', 'client-gateway'],
  },
] as const;

const NARRATION = STEPS.map((step) => step.narration);

type NodeId =
  | 'client'
  | 'gateway'
  | 'catalogue'
  | 'product-db'
  | 'order'
  | 'order-db'
  | 'payment'
  | 'provider';
type Kind = 'client' | 'gateway' | 'service' | 'database' | 'provider';

const NODE_INFO: Record<NodeId, { title: string; detail: string; kind: Kind }> = {
  client: { title: 'Web client', detail: 'public caller', kind: 'client' },
  gateway: { title: 'API gateway', detail: 'routes requests', kind: 'gateway' },
  catalogue: { title: 'Catalogue service', detail: 'product capability', kind: 'service' },
  'product-db': { title: 'Product database', detail: 'catalogue-owned data', kind: 'database' },
  order: { title: 'Order service', detail: 'order capability', kind: 'service' },
  'order-db': { title: 'Order database', detail: 'order-owned data', kind: 'database' },
  payment: { title: 'Payment service', detail: 'payment boundary', kind: 'service' },
  provider: { title: 'Payment provider', detail: 'external dependency', kind: 'provider' },
};

function Icon({ kind }: { kind: Kind }) {
  if (kind === 'client') {
    return (
      <>
        <rect x="-20" y="-15" width="40" height="28" rx="3" fill="none" />
        <path d="M-20-6h40M-7 18H7M0 13v5" />
      </>
    );
  }
  if (kind === 'gateway') {
    return (
      <>
        <path d="M-22-14h14v28h-14M22-14H8v28h14M-8 0H8M3-5l5 5-5 5" />
      </>
    );
  }
  if (kind === 'database') {
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
  if (kind === 'provider') {
    return (
      <>
        <rect x="-24" y="-15" width="48" height="30" rx="4" fill="none" />
        <path d="M-24-5h48M-15 7h12M11 2l4 4 7-8" />
      </>
    );
  }
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

function Node({
  id,
  x,
  y,
  active,
  width = 135,
  height = 84,
}: {
  id: NodeId;
  x: number;
  y: number;
  active: boolean;
  width?: number;
  height?: number;
}) {
  const info = NODE_INFO[id];
  return (
    <g aria-label={`${info.title}: ${info.detail}`}>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx="12"
        fill={active ? 'color-mix(in srgb, var(--accent) 13%, var(--bg))' : 'var(--bg)'}
        stroke={active ? 'var(--accent)' : 'var(--border)'}
        strokeWidth={active ? 2.5 : 1.5}
      />
      <g
        transform={`translate(${x + width / 2} ${y + 25})`}
        fill="none"
        stroke={active ? 'var(--accent)' : 'var(--fg-muted)'}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Icon kind={info.kind} />
      </g>
      <text
        x={x + width / 2}
        y={y + 54}
        textAnchor="middle"
        fill="var(--fg)"
        className="text-[10px] font-semibold"
      >
        {info.title}
      </text>
      <text
        x={x + width / 2}
        y={y + 70}
        textAnchor="middle"
        fill="var(--fg-muted)"
        className="text-[8px]"
      >
        {info.detail}
      </text>
    </g>
  );
}

function Edge({
  id,
  d,
  active,
  marker = true,
}: {
  id: string;
  d: string;
  active: boolean;
  marker?: boolean;
}) {
  return (
    <path
      d={d}
      fill="none"
      stroke={active ? 'var(--accent)' : 'var(--border)'}
      strokeWidth={active ? 2.5 : 1.5}
      markerEnd={marker ? 'url(#distributed-arrow)' : undefined}
      style={{ transition: 'stroke 220ms ease' }}
      data-edge={id}
    />
  );
}

function Desktop({ step }: { step: number }) {
  const current = STEPS[step]!;
  const active = (id: string) => (current.edges as readonly string[]).includes(id);
  return (
    <svg
      viewBox="0 0 820 430"
      className="hidden h-full w-full sm:block"
      role="img"
      aria-label={`${current.phase}: ${current.narration}`}
    >
      <defs>
        <marker
          id="distributed-arrow"
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
        x="295"
        y="12"
        width="230"
        height="30"
        rx="15"
        fill="var(--bg)"
        stroke="var(--border)"
      />
      <text
        x="410"
        y="32"
        textAnchor="middle"
        fill="var(--fg)"
        className="text-[11px] font-semibold"
      >
        {step + 1}. {current.phase}
      </text>

      <Edge id="client-gateway" d="M145 206H185" active={active('client-gateway')} />
      <Edge
        id="gateway-catalogue"
        d="M320 185H337Q349 185 349 173V111Q349 99 361 99H365"
        active={active('gateway-catalogue')}
      />
      <Edge id="gateway-order" d="M320 206H375" active={active('gateway-order')} />
      <Edge id="catalogue-product" d="M510 99H555" active={active('catalogue-product')} />
      <Edge id="order-db" d="M510 206H555" active={active('order-db')} />
      <Edge id="order-payment" d="M442 248V289" active={active('order-payment')} />
      <Edge id="payment-provider" d="M510 331H555" active={active('payment-provider')} />

      <Node id="client" x={10} y={164} active={current.node === 'client'} />
      <Node id="gateway" x={185} y={164} active={current.node === 'gateway'} />
      <Node id="catalogue" x={375} y={57} active={current.node === 'catalogue'} />
      <Node id="product-db" x={555} y={57} active={current.node === 'product-db'} />
      <Node id="order" x={375} y={164} active={current.node === 'order'} />
      <Node id="order-db" x={555} y={164} active={current.node === 'order-db'} />
      <Node id="payment" x={375} y={289} active={current.node === 'payment'} />
      <Node id="provider" x={555} y={289} active={current.node === 'provider'} />

      <rect
        x="270"
        y="390"
        width="280"
        height="26"
        rx="7"
        fill="color-mix(in srgb, var(--accent) 10%, var(--bg))"
      />
      <text
        x="410"
        y="407"
        textAnchor="middle"
        fill="var(--fg)"
        className="font-mono text-[9px]"
      >
        {current.payload}
      </text>
    </svg>
  );
}

function Mobile({ step }: { step: number }) {
  const current = STEPS[step]!;
  const active = (id: string) => (current.edges as readonly string[]).includes(id);
  const mobileEdges: Array<[string, string]> = [
    ['client-gateway', 'M180 138V158'],
    ['gateway-catalogue', 'M165 242V280H95V300'],
    ['catalogue-product', 'M95 384V408'],
    ['gateway-order', 'M195 242V280H265V300'],
    ['order-db', 'M265 384V408'],
    ['order-payment', 'M265 492V530H95V550'],
    ['payment-provider', 'M95 634V658'],
  ];

  return (
    <svg
      viewBox="0 0 360 940"
      className="h-full w-full sm:hidden"
      role="img"
      aria-label={`${current.phase}: ${current.narration}`}
    >
      <defs>
        <marker
          id="distributed-arrow-mobile"
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

      {mobileEdges.map(([id, d]) => (
        <path
          key={id}
          d={d}
          fill="none"
          stroke={active(id) ? 'var(--accent)' : 'var(--border)'}
          strokeWidth={active(id) ? 2.5 : 1.5}
          markerEnd="url(#distributed-arrow-mobile)"
        />
      ))}

      <Node id="client" x={105} y={54} width={150} active={current.node === 'client'} />
      <Node id="gateway" x={105} y={158} width={150} active={current.node === 'gateway'} />
      <Node id="catalogue" x={20} y={300} width={150} active={current.node === 'catalogue'} />
      <Node id="product-db" x={20} y={408} width={150} active={current.node === 'product-db'} />
      <Node id="order" x={190} y={300} width={150} active={current.node === 'order'} />
      <Node id="order-db" x={190} y={408} width={150} active={current.node === 'order-db'} />
      <Node id="payment" x={20} y={550} width={150} active={current.node === 'payment'} />
      <Node id="provider" x={20} y={658} width={150} active={current.node === 'provider'} />

      <rect
        x="35"
        y="785"
        width="290"
        height="28"
        rx="7"
        fill="color-mix(in srgb, var(--accent) 10%, var(--bg))"
      />
      <text
        x="180"
        y="803"
        textAnchor="middle"
        fill="var(--fg)"
        className="font-mono text-[9px]"
      >
        {current.payload}
      </text>
      <text x="180" y="850" textAnchor="middle" fill="var(--fg-muted)" className="text-[9px]">
        Each service is an independent network boundary
      </text>
    </svg>
  );
}

export function DistributedShopScene() {
  const playback = usePlayback({ stepCount: STEPS.length });
  return (
    <SceneShell playback={playback} narration={NARRATION} label="Distributed system">
      <Desktop step={playback.step} />
      <Mobile step={playback.step} />
    </SceneShell>
  );
}
