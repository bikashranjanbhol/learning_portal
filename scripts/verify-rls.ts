/**
 * RLS verification — proves the policies actually block cross-user access.
 *
 * Sprint 0 definition of done: "write a script that attempts to read another
 * user's rows with their JWT and confirms it's blocked. I want to see it fail
 * correctly."
 *
 * The script creates two throwaway users, seeds a subscription for each with
 * the service-role key, then acts *as each user's JWT* and asserts that every
 * cross-user read and write is refused. Anything that succeeds when it should
 * not is a FAIL and exits non-zero.
 *
 *   npm run verify:rls
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY. Run it against a development project —
 * it creates and deletes users.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../lib/supabase/database.types';

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

function env(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`\n  Missing ${name}. Load your local env first:\n`);
    console.error('    set -a && source .env.local && set +a && npm run verify:rls\n');
    process.exit(1);
  }
  return value;
}

const SUPABASE_URL = env('NEXT_PUBLIC_SUPABASE_URL');
const ANON_KEY = env('NEXT_PUBLIC_SUPABASE_ANON_KEY');
const SERVICE_ROLE_KEY = env('SUPABASE_SERVICE_ROLE_KEY');

const admin = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// Assertions
// ---------------------------------------------------------------------------

let failures = 0;
let checks = 0;

function record(passed: boolean, label: string, detail = '') {
  checks += 1;
  if (passed) {
    console.log(`  \x1b[32mPASS\x1b[0m  ${label}`);
  } else {
    failures += 1;
    console.log(`  \x1b[31mFAIL\x1b[0m  ${label}${detail ? `\n         ${detail}` : ''}`);
  }
}

/** A blocked read returns zero rows rather than an error — RLS filters, it does not throw. */
function expectNoRows(result: { data: unknown[] | null; error: unknown }, label: string) {
  const rows = result.data ?? [];
  record(rows.length === 0, label, `returned ${rows.length} row(s) — RLS is not filtering`);
}

function expectRows(result: { data: unknown[] | null; error: unknown }, label: string) {
  const rows = result.data ?? [];
  record(rows.length > 0, label, 'returned 0 rows — the policy is too strict');
}

/** A blocked write must error (or affect nothing). Silent success is the dangerous case. */
function expectWriteBlocked(
  result: { data: unknown[] | null; error: { message: string } | null },
  label: string,
) {
  const blocked = result.error !== null || (result.data ?? []).length === 0;
  record(blocked, label, 'the write was accepted — a client can modify data it does not own');
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

type TestUser = {
  id: string;
  email: string;
  password: string;
  client: SupabaseClient<Database>;
};

const stamp = Date.now();

async function createTestUser(label: string): Promise<TestUser> {
  const email = `rls-${label}-${stamp}@example.com`;
  const password = `pw-${stamp}-${Math.random().toString(36).slice(2)}`;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: `RLS Test ${label}` },
  });
  if (error || !data.user) throw new Error(`createUser(${label}) failed: ${error?.message}`);

  // Each user gets its own client so the JWTs never share storage.
  const client = createClient<Database>(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const signIn = await client.auth.signInWithPassword({ email, password });
  if (signIn.error) throw new Error(`signIn(${label}) failed: ${signIn.error.message}`);

  return { id: data.user.id, email, password, client };
}

async function seedSubscription(userId: string, label: string) {
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await admin.from('subscriptions').insert({
    user_id: userId,
    tier: 'monthly',
    status: 'active',
    expires_at: expires,
    stripe_checkout_id: `cs_test_${label}_${stamp}`,
    amount_cents: 2900,
  });
  if (error) throw new Error(`seedSubscription(${label}) failed: ${error.message}`);
}

async function cleanup(users: TestUser[]) {
  for (const user of users) {
    await admin.auth.admin.deleteUser(user.id).catch(() => undefined);
  }
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

async function main() {
  console.log('\nRLS verification');
  console.log(`  project: ${SUPABASE_URL}\n`);

  const users: TestUser[] = [];

  try {
    const alice = await createTestUser('alice');
    const bob = await createTestUser('bob');
    users.push(alice, bob);

    // The handle_new_user trigger should have mirrored both into public.users.
    const mirrored = await admin.from('users').select('id').in('id', [alice.id, bob.id]);
    record(
      (mirrored.data ?? []).length === 2,
      'handle_new_user trigger mirrors auth.users into public.users',
      `found ${(mirrored.data ?? []).length}/2 rows`,
    );

    await seedSubscription(alice.id, 'alice');
    await seedSubscription(bob.id, 'bob');

    console.log('\n  users ------------------------------------------------------');

    expectRows(
      await alice.client.from('users').select('*').eq('id', alice.id),
      'Alice reads her own profile',
    );

    expectNoRows(
      await alice.client.from('users').select('*').eq('id', bob.id),
      "Alice CANNOT read Bob's profile",
    );

    // Unfiltered select: RLS must narrow this to Alice's row alone.
    const allUsers = await alice.client.from('users').select('*');
    record(
      (allUsers.data ?? []).length === 1 && allUsers.data?.[0]?.id === alice.id,
      'Unfiltered select on users returns only the caller',
      `returned ${(allUsers.data ?? []).length} row(s)`,
    );

    expectWriteBlocked(
      await alice.client.from('users').update({ name: 'pwned' }).eq('id', bob.id).select(),
      "Alice CANNOT update Bob's profile",
    );

    console.log('\n  subscriptions ----------------------------------------------');

    expectRows(
      await alice.client.from('subscriptions').select('*'),
      'Alice reads her own subscription',
    );

    const aliceSubs = await alice.client.from('subscriptions').select('user_id');
    record(
      (aliceSubs.data ?? []).every((row) => row.user_id === alice.id),
      "Alice's subscription query contains no other user's rows",
      `saw user_ids: ${[...new Set((aliceSubs.data ?? []).map((r) => r.user_id))].join(', ')}`,
    );

    expectNoRows(
      await alice.client.from('subscriptions').select('*').eq('user_id', bob.id),
      "Alice CANNOT read Bob's subscription",
    );

    // The one that matters commercially: self-granting entitlements.
    expectWriteBlocked(
      await alice.client
        .from('subscriptions')
        .insert({ user_id: alice.id, tier: 'lifetime', status: 'active' })
        .select(),
      'Alice CANNOT grant herself lifetime access',
    );

    expectWriteBlocked(
      await alice.client
        .from('subscriptions')
        .update({ tier: 'lifetime', expires_at: null })
        .eq('user_id', alice.id)
        .select(),
      'Alice CANNOT upgrade her own subscription row',
    );

    expectWriteBlocked(
      await alice.client.from('subscriptions').delete().eq('user_id', bob.id).select(),
      "Alice CANNOT delete Bob's subscription",
    );

    console.log('\n  anonymous --------------------------------------------------');

    const anon = createClient<Database>(SUPABASE_URL, ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    expectNoRows(await anon.from('users').select('*'), 'Anonymous CANNOT read users');
    expectNoRows(
      await anon.from('subscriptions').select('*'),
      'Anonymous CANNOT read subscriptions',
    );

    console.log('\n  entitlement helper -----------------------------------------');

    const aliceAccess = await alice.client.rpc('has_active_access');
    record(
      aliceAccess.data === true,
      'has_active_access() is true for Alice (active, unexpired)',
    );

    // Bob's own row says true; asking about someone else must not leak.
    const bobAsksAboutAlice = await bob.client.rpc('has_active_access', {
      check_user_id: alice.id,
    });
    record(
      bobAsksAboutAlice.data === false,
      "has_active_access() does not leak Alice's status to Bob",
      "the function is SECURITY INVOKER, so RLS should hide Alice's rows from Bob",
    );
  } catch (error) {
    failures += 1;
    console.error(`\n  \x1b[31mERROR\x1b[0m ${(error as Error).message}`);
  } finally {
    await cleanup(users);
  }

  console.log(`\n  ${checks - failures}/${checks} checks passed\n`);

  if (failures > 0) {
    console.error(
      `\x1b[31m  RLS verification FAILED — ${failures} check(s) did not pass.\x1b[0m\n`,
    );
    process.exit(1);
  }
  console.log('\x1b[32m  RLS verified.\x1b[0m\n');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
