'use client';

import { SceneShell } from '../scene-shell';
import { usePlayback } from '../use-playback';

const STEPS = [
  {
    phase: 'Checkout request',
    payload: 'POST /checkout',
    narration: 'The browser sends one checkout request to one Shop application.',
    active: 'browser',
    module: -1,
  },
  {
    phase: 'Route internally',
    payload: 'Router → Checkout module',
    narration:
      'The application routes the request to the Checkout module without making a network call.',
    active: 'app',
    module: 2,
  },
  {
    phase: 'Identify customer',
    payload: 'Account.currentCustomer()',
    narration: 'The Checkout module calls the Account module directly in the same process.',
    active: 'app',
    module: 3,
  },
  {
    phase: 'Read basket',
    payload: 'Basket.items()',
    narration: 'The Basket module supplies the selected items through another in-process call.',
    active: 'app',
    module: 1,
  },
  {
    phase: 'Check products',
    payload: 'Catalogue.reserve(items)',
    narration:
      'The Catalogue module checks current products and inventory inside the same application.',
    active: 'app',
    module: 0,
  },
  {
    phase: 'Coordinate order',
    payload: 'Checkout.createOrder()',
    narration:
      'The Checkout module coordinates the result and prepares one database transaction.',
    active: 'app',
    module: 2,
  },
  {
    phase: 'Commit transaction',
    payload: 'Basket + inventory + order',
    narration: 'The application commits related changes to the shared Shop database.',
    active: 'database',
    module: -1,
  },
  {
    phase: 'Return response',
    payload: '201 Created · order-814',
    narration: 'The same application returns the completed order response to the browser.',
    active: 'browser',
    module: -1,
  },
] as const;

const NARRATION = STEPS.map((step) => step.narration);
const MODULES = [
  { name: 'Catalogue', detail: 'products & inventory' },
  { name: 'Basket', detail: 'selected items' },
  { name: 'Checkout', detail: 'order coordination' },
  { name: 'Account', detail: 'customer identity' },
] as const;

function BrowserIcon() {
  return (
    <>
      <rect x="-23" y="-18" width="46" height="33" rx="4" fill="none" />
      <path d="M-23-8h46M-16-13h1M-10-13h1M-7 21H7M0 15v6" />
    </>
  );
}

function DatabaseIcon() {
  return (
    <>
      <ellipse cx="0" cy="-13" rx="24" ry="7" fill="none" />
      <path
        d="M-24-13v27c0 4 11 7 24 7s24-3 24-7v-27M-24 0c0 4 11 7 24 7s24-3 24-7"
        fill="none"
      />
    </>
  );
}

function ExternalNode({
  x,
  y,
  title,
  detail,
  kind,
  active,
  width = 150,
}: {
  x: number;
  y: number;
  title: string;
  detail: string;
  kind: 'browser' | 'database';
  active: boolean;
  width?: number;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height="116"
        rx="14"
        fill={active ? 'color-mix(in srgb, var(--accent) 13%, var(--bg))' : 'var(--bg)'}
        stroke={active ? 'var(--accent)' : 'var(--border)'}
        strokeWidth={active ? 2.5 : 1.5}
      />
      <g
        transform={`translate(${x + width / 2} ${y + 35})`}
        fill="none"
        stroke={active ? 'var(--accent)' : 'var(--fg-muted)'}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {kind === 'browser' ? <BrowserIcon /> : <DatabaseIcon />}
      </g>
      <text
        x={x + width / 2}
        y={y + 75}
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

function Module({
  x,
  y,
  index,
  active,
  width = 125,
}: {
  x: number;
  y: number;
  index: number;
  active: boolean;
  width?: number;
}) {
  const moduleInfo = MODULES[index]!;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height="58"
        rx="9"
        fill={active ? 'color-mix(in srgb, var(--accent) 14%, var(--bg))' : 'var(--bg)'}
        stroke={active ? 'var(--accent)' : 'var(--border)'}
        strokeWidth={active ? 2 : 1}
      />
      <text
        x={x + width / 2}
        y={y + 25}
        textAnchor="middle"
        fill="var(--fg)"
        className="text-[10px] font-semibold"
      >
        {moduleInfo.name}
      </text>
      <text
        x={x + width / 2}
        y={y + 43}
        textAnchor="middle"
        fill="var(--fg-muted)"
        className="text-[8px]"
      >
        {moduleInfo.detail}
      </text>
    </g>
  );
}

function Desktop({ step }: { step: number }) {
  const current = STEPS[step]!;
  const modulePositions = [
    { x: 245, y: 107 },
    { x: 385, y: 107 },
    { x: 245, y: 180 },
    { x: 385, y: 180 },
  ];

  return (
    <svg
      viewBox="0 0 740 390"
      className="hidden h-full w-full sm:block"
      role="img"
      aria-label={`${current.phase}: ${current.narration}`}
    >
      <defs>
        <marker
          id="monolith-arrow"
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
        d="M165 150H215M525 150H575"
        stroke="var(--border)"
        strokeWidth="2"
        markerEnd="url(#monolith-arrow)"
      />
      <path
        d="M575 190H525M215 190H165"
        stroke="var(--border)"
        strokeWidth="2"
        markerEnd="url(#monolith-arrow)"
      />

      <ExternalNode
        x={15}
        y={112}
        title="Browser"
        detail="one client request"
        kind="browser"
        active={current.active === 'browser'}
      />
      <rect
        x="215"
        y="63"
        width="310"
        height="222"
        rx="16"
        fill={
          current.active === 'app'
            ? 'color-mix(in srgb, var(--accent) 6%, var(--bg))'
            : 'var(--bg-subtle)'
        }
        stroke={current.active === 'app' ? 'var(--accent)' : 'var(--border)'}
        strokeWidth={current.active === 'app' ? 2.5 : 1.5}
      />
      <text
        x="370"
        y="88"
        textAnchor="middle"
        fill="var(--fg)"
        className="text-[12px] font-semibold"
      >
        Shop application · one deployable process
      </text>
      {modulePositions.map((position, index) => (
        <Module key={index} {...position} index={index} active={current.module === index} />
      ))}
      <ExternalNode
        x={575}
        y={112}
        title="Shop database"
        detail="shared durable state"
        kind="database"
        active={current.active === 'database'}
      />

      <rect
        x="225"
        y="316"
        width="290"
        height="28"
        rx="7"
        fill="color-mix(in srgb, var(--accent) 10%, var(--bg))"
      />
      <text
        x="370"
        y="334"
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
  const modulePositions = [
    { x: 36, y: 230 },
    { x: 184, y: 230 },
    { x: 36, y: 298 },
    { x: 184, y: 298 },
  ];

  return (
    <svg
      viewBox="0 0 360 750"
      className="h-full w-full sm:hidden"
      role="img"
      aria-label={`${current.phase}: ${current.narration}`}
    >
      <defs>
        <marker
          id="monolith-arrow-mobile"
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
        d="M180 158V184M180 390V420"
        stroke="var(--border)"
        strokeWidth="2"
        markerEnd="url(#monolith-arrow-mobile)"
      />
      <ExternalNode
        x={90}
        y={54}
        width={180}
        title="Browser"
        detail="one client request"
        kind="browser"
        active={current.active === 'browser'}
      />
      <rect
        x="20"
        y="190"
        width="320"
        height="200"
        rx="16"
        fill={
          current.active === 'app'
            ? 'color-mix(in srgb, var(--accent) 6%, var(--bg))'
            : 'var(--bg-subtle)'
        }
        stroke={current.active === 'app' ? 'var(--accent)' : 'var(--border)'}
        strokeWidth={current.active === 'app' ? 2.5 : 1.5}
      />
      <text
        x="180"
        y="215"
        textAnchor="middle"
        fill="var(--fg)"
        className="text-[10px] font-semibold"
      >
        Shop application · one process
      </text>
      {modulePositions.map((position, index) => (
        <Module
          key={index}
          {...position}
          width={140}
          index={index}
          active={current.module === index}
        />
      ))}
      <ExternalNode
        x={90}
        y={426}
        width={180}
        title="Shop database"
        detail="shared durable state"
        kind="database"
        active={current.active === 'database'}
      />

      <rect
        x="35"
        y="590"
        width="290"
        height="28"
        rx="7"
        fill="color-mix(in srgb, var(--accent) 10%, var(--bg))"
      />
      <text
        x="180"
        y="608"
        textAnchor="middle"
        fill="var(--fg)"
        className="font-mono text-[9px]"
      >
        {current.payload}
      </text>
      <text x="180" y="653" textAnchor="middle" fill="var(--fg-muted)" className="text-[9px]">
        Module calls stay inside one application process
      </text>
    </svg>
  );
}

export function ModularMonolithScene() {
  const playback = usePlayback({ stepCount: STEPS.length });

  return (
    <SceneShell playback={playback} narration={NARRATION} label="Modular monolith">
      <Desktop step={playback.step} />
      <Mobile step={playback.step} />
    </SceneShell>
  );
}
