import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { safeRedirect } from '@/lib/routes';

const VALID_TYPES: readonly EmailOtpType[] = [
  'magiclink',
  'signup',
  'invite',
  'recovery',
  'email_change',
  'email',
];

/**
 * Magic-link confirmation.
 *
 * Uses the token_hash flow rather than the implicit `#access_token` fragment.
 * A fragment never reaches the server, so the session would exist only in the
 * browser and every server component would see a logged-out user.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = safeRedirect(searchParams.get('next'));

  if (!tokenHash || !type || !VALID_TYPES.includes(type)) {
    return NextResponse.redirect(`${origin}/auth/error?reason=invalid_link`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  if (error) {
    return NextResponse.redirect(
      `${origin}/auth/error?reason=${encodeURIComponent(error.message)}`,
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
