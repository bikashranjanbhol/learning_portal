'use client';

import { useEffect } from 'react';

/**
 * Catches errors thrown in the root layout itself, where app/error.tsx cannot
 * help. It must render its own <html> and <body> because the root layout has
 * already failed.
 */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          display: 'grid',
          placeItems: 'center',
          minHeight: '100dvh',
          margin: 0,
          padding: '1rem',
          textAlign: 'center',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Something went wrong</h1>
          <p style={{ marginTop: '0.75rem', color: '#666' }}>
            Please reload the page. If it keeps happening, the site is having a bad day.
          </p>
        </div>
      </body>
    </html>
  );
}
