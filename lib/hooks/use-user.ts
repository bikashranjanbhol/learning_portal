'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

export type UserState = {
  user: User | null;
  /** True until the first auth check resolves. Render a placeholder, not nothing. */
  loading: boolean;
};

/**
 * Client-side session state.
 *
 * CLAUDE.md #2: personalisation hydrates after load. This is the mechanism —
 * a page stays statically generated and the header fills in the signed-in
 * state once this resolves. Nothing here runs during prerender.
 */
export function useUser(): UserState {
  const [state, setState] = useState<UserState>({ user: null, loading: true });

  useEffect(() => {
    let active = true;

    // Degrade to "signed out" rather than throwing.
    //
    // This hook renders inside the site header, so an exception here would take
    // down every page on the site — including the statically generated ones
    // that have no business depending on Supabase being reachable. Missing env
    // vars, an unreachable project and an expired token all end up here, and
    // none of them should blank the page.
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch (error) {
      console.warn('Supabase client unavailable; treating visitor as signed out.', error);
      setState({ user: null, loading: false });
      return;
    }

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (active) setState({ user: data.user, loading: false });
      })
      .catch((error: unknown) => {
        console.warn('Could not resolve the current session.', error);
        if (active) setState({ user: null, loading: false });
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setState({ user: session?.user ?? null, loading: false });
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}
