import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST-only sign-out.
 *
 * A GET would let any `<img src="/auth/sign-out">` on a third-party page log
 * the user out — low severity, but free to prevent.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/', request.url), { status: 303 });
}
