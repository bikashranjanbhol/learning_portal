import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';
import { site } from '@/lib/site';

/**
 * Dynamic Open Graph images.
 *
 * Edge runtime — these are rendered on demand and cached at the CDN, so they
 * must not pull in the Node runtime or anything from lib/supabase.
 *
 *   /api/og?title=...&subtitle=...&eyebrow=...
 *
 * No custom font is loaded deliberately. Fetching a font file on every cold
 * render adds latency and one more thing that can fail, and social scrapers
 * time out fast. The built-in font is unremarkable but always renders.
 */
export const runtime = 'edge';

const WIDTH = 1200;
const HEIGHT = 630;

/** Long titles must truncate rather than overflow the canvas. */
function clamp(value: string | null, max: number): string {
  if (!value) return '';
  const trimmed = value.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max - 1).trimEnd()}…` : trimmed;
}

export function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const title = clamp(searchParams.get('title'), 100) || site.name;
  const subtitle = clamp(searchParams.get('subtitle'), 160);
  const eyebrow = clamp(searchParams.get('eyebrow'), 40);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0d1117',
          padding: '72px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Accent bar, so the card is recognisable at thumbnail size. */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '10px',
            background: '#4c6ef5',
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {eyebrow ? (
            <div
              style={{
                fontSize: 26,
                color: '#8b95a5',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: 24,
              }}
            >
              {eyebrow}
            </div>
          ) : null}

          <div
            style={{
              fontSize: title.length > 55 ? 62 : 76,
              fontWeight: 700,
              color: '#f0f3f6',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </div>

          {subtitle ? (
            <div
              style={{
                fontSize: 30,
                color: '#8b95a5',
                lineHeight: 1.4,
                marginTop: 28,
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              borderRadius: 10,
              background: '#4c6ef5',
              color: '#ffffff',
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            IP
          </div>
          <div style={{ fontSize: 26, color: '#f0f3f6', fontWeight: 600 }}>{site.name}</div>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      headers: {
        // Immutable: the image is a pure function of the query string, so a
        // changed title produces a different URL rather than a stale cache hit.
        'Cache-Control': 'public, immutable, no-transform, max-age=31536000',
      },
    },
  );
}
