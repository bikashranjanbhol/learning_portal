'use client';

import { SceneShell } from '../scene-shell';
import { usePlayback } from '../use-playback';

type NodeId =
  | 'client'
  | 'balancer'
  | 'app'
  | 'cache'
  | 'orders'
  | 'payment'
  | 'queue'
  | 'worker';

type NodeSpec = {
  id: NodeId;
  title: string;
  subtitle: string;
  desktop: { x: number; y: number };
  mobile: { x: number; y: number };
};

const NODES: NodeSpec[] = [
  {
    id: 'client',
    title: 'Web client',
    subtitle: 'Browser',
    desktop: { x: 10, y: 220 },
    mobile: { x: 110, y: 45 },
  },
  {
    id: 'balancer',
    title: 'Load balancer',
    subtitle: 'Traffic routing',
    desktop: { x: 175, y: 220 },
    mobile: { x: 110, y: 145 },
  },
  {
    id: 'app',
    title: 'Shop application',
    subtitle: 'Business logic',
    desktop: { x: 340, y: 220 },
    mobile: { x: 110, y: 245 },
  },
  {
    id: 'cache',
    title: 'Product cache',
    subtitle: 'Fast product reads',
    desktop: { x: 560, y: 55 },
    mobile: { x: 15, y: 365 },
  },
  {
    id: 'orders',
    title: 'Orders database',
    subtitle: 'System of record',
    desktop: { x: 560, y: 165 },
    mobile: { x: 205, y: 365 },
  },
  {
    id: 'payment',
    title: 'Payment provider',
    subtitle: 'External dependency',
    desktop: { x: 560, y: 275 },
    mobile: { x: 15, y: 465 },
  },
  {
    id: 'queue',
    title: 'Message queue',
    subtitle: 'Background jobs',
    desktop: { x: 560, y: 385 },
    mobile: { x: 205, y: 465 },
  },
  {
    id: 'worker',
    title: 'Email worker',
    subtitle: 'Asynchronous work',
    desktop: { x: 730, y: 385 },
    mobile: { x: 110, y: 580 },
  },
];

const EDGES: Array<[NodeId, NodeId]> = [
  ['client', 'balancer'],
  ['balancer', 'app'],
  ['app', 'cache'],
  ['app', 'orders'],
  ['app', 'payment'],
  ['app', 'queue'],
  ['queue', 'worker'],
];

const STEPS: Array<{
  phase: string;
  payload: string;
  activeNodes: NodeId[];
  activeEdges: Array<[NodeId, NodeId]>;
  narration: string;
}> = [
  {
    phase: 'Client request',
    payload: 'Checkout',
    activeNodes: ['client'],
    activeEdges: [],
    narration:
      'The web client starts a checkout request. It knows the public API, not the internal architecture.',
  },
  {
    phase: 'Traffic routing',
    payload: 'HTTPS request',
    activeNodes: ['client', 'balancer'],
    activeEdges: [['client', 'balancer']],
    narration:
      'The load balancer receives the request and chooses a healthy shop application instance.',
  },
  {
    phase: 'Business logic',
    payload: 'Validate basket',
    activeNodes: ['balancer', 'app'],
    activeEdges: [['balancer', 'app']],
    narration:
      'The shop application validates the basket and coordinates every downstream dependency.',
  },
  {
    phase: 'Product lookup',
    payload: 'GET product',
    activeNodes: ['app', 'cache'],
    activeEdges: [['app', 'cache']],
    narration:
      'Product data is read from the cache for low latency. The cache owns only a temporary copy.',
  },
  {
    phase: 'Order persistence',
    payload: 'INSERT order',
    activeNodes: ['app', 'orders'],
    activeEdges: [['app', 'orders']],
    narration:
      'The completed order is written to the orders database, which is the system of record.',
  },
  {
    phase: 'Payment',
    payload: 'Authorise payment',
    activeNodes: ['app', 'payment'],
    activeEdges: [['app', 'payment']],
    narration:
      'The application calls the external payment provider on the synchronous checkout path.',
  },
  {
    phase: 'Background job',
    payload: 'OrderConfirmed',
    activeNodes: ['app', 'queue'],
    activeEdges: [['app', 'queue']],
    narration:
      'The application publishes an email job to the queue so checkout does not wait for email delivery.',
  },
  {
    phase: 'Email delivery',
    payload: 'Send confirmation',
    activeNodes: ['queue', 'worker'],
    activeEdges: [['queue', 'worker']],
    narration:
      'The email worker consumes the queued job independently. It never communicates with the browser.',
  },
];

const NARRATION = STEPS.map((step) => step.narration);
const BY_ID = new Map(NODES.map((node) => [node.id, node]));
const SIZE = {
  desktop: { width: 125, height: 80 },
  mobile: { width: 140, height: 85 },
};

type Layout = keyof typeof SIZE;

function box(node: NodeSpec, layout: Layout) {
  const size = SIZE[layout];
  const point = node[layout];
  return {
    x: point.x,
    y: point.y,
    width: size.width,
    height: size.height,
    cx: point.x + size.width / 2,
    cy: point.y + size.height / 2,
  };
}

function edgePath(from: NodeSpec, to: NodeSpec, layout: Layout) {
  const a = box(from, layout);
  const b = box(to, layout);

  if (layout === 'desktop' && from.id === 'app') {
    return `M${a.x + a.width} ${a.cy} H530 V${b.cy} H${b.x}`;
  }

  if (layout === 'mobile' && from.id === 'app') {
    const left = to.id === 'cache' || to.id === 'payment';
    const railX = left ? 2 : 358;
    const targetX = left ? b.x : b.x + b.width;
    return `M${a.cx} ${a.y + a.height} V345 H${railX} V${b.cy} H${targetX}`;
  }

  if (b.x > a.x + a.width) {
    const middle = (a.x + a.width + b.x) / 2;
    return `M${a.x + a.width} ${a.cy} H${middle} V${b.cy} H${b.x}`;
  }

  const middle = (a.y + a.height + b.y) / 2;
  return `M${a.cx} ${a.y + a.height} V${middle} H${b.cx} V${b.y}`;
}

function NodeIcon({ id }: { id: NodeId }) {
  if (id === 'client') {
    return (
      <>
        <rect x="-9" y="-7" width="18" height="13" rx="2" fill="none" stroke="currentColor" />
        <path d="M-9-3h18M-3 9h6" stroke="currentColor" />
      </>
    );
  }

  if (id === 'cache' || id === 'orders') {
    return (
      <>
        <ellipse cx="0" cy="-5" rx="9" ry="3" fill="none" stroke="currentColor" />
        <path d="M-9-5v10c0 2 4 3 9 3s9-1 9-3V-5" fill="none" stroke="currentColor" />
      </>
    );
  }

  if (id === 'queue') {
    return (
      <>
        {[-8, -1, 6].map((x) => (
          <rect
            key={x}
            x={x}
            y="-5"
            width="5"
            height="10"
            rx="1"
            fill="none"
            stroke="currentColor"
          />
        ))}
      </>
    );
  }

  if (id === 'payment') {
    return (
      <>
        <rect x="-10" y="-6" width="20" height="13" rx="2" fill="none" stroke="currentColor" />
        <path d="M-10-1h20" stroke="currentColor" />
      </>
    );
  }

  if (id === 'balancer') {
    return (
      <>
        <circle cx="-7" cy="0" r="3" fill="none" stroke="currentColor" />
        <path d="M-4-1 4-5M-4 1 4 5" stroke="currentColor" />
        <circle cx="7" cy="-6" r="2.5" fill="none" stroke="currentColor" />
        <circle cx="7" cy="6" r="2.5" fill="none" stroke="currentColor" />
      </>
    );
  }

  return (
    <>
      {[-6, 1].map((y) => (
        <rect
          key={y}
          x="-10"
          y={y}
          width="20"
          height="5"
          rx="1.5"
          fill="none"
          stroke="currentColor"
        />
      ))}
    </>
  );
}

function DiagramNode({
  node,
  layout,
  active,
}: {
  node: NodeSpec;
  layout: Layout;
  active: boolean;
}) {
  const b = box(node, layout);

  return (
    <g>
      <rect
        x={b.x}
        y={b.y}
        width={b.width}
        height={b.height}
        rx="9"
        fill={active ? 'color-mix(in srgb, var(--accent) 14%, var(--bg))' : 'var(--bg)'}
        stroke={active ? 'var(--accent)' : 'var(--border)'}
        strokeWidth={active ? 2.5 : 1.5}
        style={{ transition: 'fill 250ms ease, stroke 250ms ease' }}
      />
      <g transform={`translate(${b.cx} ${b.y + 25})`} strokeWidth="1.7">
        <NodeIcon id={node.id} />
      </g>
      <text
        x={b.cx}
        y={b.y + 55}
        textAnchor="middle"
        fill="var(--fg)"
        className="text-[11px] font-semibold"
      >
        {node.title}
      </text>
      <text
        x={b.cx}
        y={b.y + 69}
        textAnchor="middle"
        fill="var(--fg-muted)"
        className="text-[9px]"
      >
        {node.subtitle}
      </text>
    </g>
  );
}

function Diagram({ layout, step }: { layout: Layout; step: number }) {
  const frame = STEPS[step]!;
  const arrowId = `hld-step-arrow-${layout}`;
  const activeArrowId = `hld-step-arrow-active-${layout}`;

  return (
    <svg
      viewBox={layout === 'desktop' ? '0 0 900 535' : '0 0 360 720'}
      className={
        layout === 'desktop'
          ? 'hidden h-full w-full text-[var(--fg)] sm:block'
          : 'h-full w-full text-[var(--fg)] sm:hidden'
      }
      role="img"
      aria-label={`${frame.phase}: ${frame.narration}`}
    >
      <defs>
        <marker
          id={arrowId}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto"
        >
          <path d="M0 0 10 5 0 10z" fill="var(--fg-muted)" />
        </marker>
        <marker
          id={activeArrowId}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto"
        >
          <path d="M0 0 10 5 0 10z" fill="var(--accent)" />
        </marker>
      </defs>

      <rect
        x={layout === 'desktop' ? 350 : 80}
        y={layout === 'desktop' ? 10 : 5}
        width="200"
        height="29"
        rx="15"
        fill="var(--bg)"
        stroke="var(--border)"
      />
      <text
        x={layout === 'desktop' ? 450 : 180}
        y={layout === 'desktop' ? 29 : 24}
        textAnchor="middle"
        fill="var(--fg)"
        className="text-[11px] font-semibold"
      >
        {step + 1}. {frame.phase}
      </text>

      {EDGES.map(([fromId, toId]) => {
        const active = frame.activeEdges.some(([from, to]) => from === fromId && to === toId);
        return (
          <path
            key={`${fromId}-${toId}`}
            d={edgePath(BY_ID.get(fromId)!, BY_ID.get(toId)!, layout)}
            fill="none"
            stroke={active ? 'var(--accent)' : 'var(--border)'}
            strokeWidth={active ? 3 : 1.5}
            markerEnd={`url(#${active ? activeArrowId : arrowId})`}
          />
        );
      })}

      {NODES.map((node) => (
        <DiagramNode
          key={node.id}
          node={node}
          layout={layout}
          active={frame.activeNodes.includes(node.id)}
        />
      ))}

      <rect
        x={layout === 'desktop' ? 350 : 80}
        y={layout === 'desktop' ? 500 : 680}
        width="200"
        height="24"
        rx="6"
        fill="color-mix(in srgb, var(--accent) 10%, var(--bg))"
      />
      <text
        x={layout === 'desktop' ? 450 : 180}
        y={layout === 'desktop' ? 516 : 696}
        textAnchor="middle"
        fill="var(--fg)"
        className="font-mono text-[10px]"
      >
        {frame.payload}
      </text>
    </svg>
  );
}

export function HldShopMapScene() {
  const playback = usePlayback({ stepCount: STEPS.length, intervalMs: 2100 });

  return (
    <SceneShell playback={playback} narration={NARRATION} label="High-level design">
      <Diagram layout="desktop" step={playback.step} />
      <Diagram layout="mobile" step={playback.step} />
    </SceneShell>
  );
}
