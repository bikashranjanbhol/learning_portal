-- ============================================================================
-- Sprint 3 — Stripe wiring
--
-- Adds the webhook idempotency ledger and tightens the entitlement function.
-- The subscriptions table itself already carries the Stripe columns and the
-- unique stripe_checkout_id from the initial migration.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- processed_stripe_events — webhook idempotency
--
-- Stripe guarantees at-least-once delivery and retries for up to three days.
-- The same event WILL arrive twice, and a replayed checkout.session.completed
-- must not grant a second 30-day period.
--
-- Two independent defences:
--   1. This table. The handler inserts the event id before doing any work; a
--      duplicate insert fails and the handler returns 200 without side effects.
--   2. subscriptions.stripe_checkout_id is UNIQUE, so even if the ledger were
--      bypassed the grant itself cannot be duplicated.
--
-- One of these would probably be enough. Both is correct for the one table in
-- this system where a bug silently gives away the product.
-- ---------------------------------------------------------------------------

create table public.processed_stripe_events (
  id           text primary key,          -- Stripe's evt_… id
  type         text        not null,
  processed_at timestamptz not null default now(),
  -- Kept for debugging a bad grant months later, when the Stripe dashboard has
  -- scrolled past it.
  payload_summary jsonb
);

comment on table public.processed_stripe_events is
  'Webhook idempotency ledger. An event id present here has already been applied.';

create index processed_stripe_events_processed_at_idx
  on public.processed_stripe_events (processed_at desc);

alter table public.processed_stripe_events enable row level security;

-- No policies at all: this is service-role only. Clients have no business
-- reading the webhook ledger, and RLS with zero policies denies everything.
revoke all on public.processed_stripe_events from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Refunds
--
-- A refunded purchase must stop granting access immediately. status is already
-- an enum containing 'refunded'; this index keeps the lookup cheap and the
-- entitlement function below already filters on status = 'active'.
-- ---------------------------------------------------------------------------

create index subscriptions_stripe_payment_intent_idx
  on public.subscriptions (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

create index subscriptions_stripe_customer_idx
  on public.subscriptions (stripe_customer_id)
  where stripe_customer_id is not null;

-- ---------------------------------------------------------------------------
-- Entitlement, restated
--
-- Unchanged in behaviour from the initial migration, but re-declared here with
-- the reasoning attached, because this function is the definition of "has the
-- user paid" and every other layer defers to it.
--
-- It asks "is there an active, unexpired grant", NOT "is there an active Stripe
-- subscription". Monthly is a one-time 30-day purchase with no renewal, so
-- there is no Stripe subscription object to consult. Access is the union of
-- unexpired rows: buying two monthly passes gives two rows and access until the
-- later expiry.
-- ---------------------------------------------------------------------------

create or replace function public.has_active_access(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.subscriptions s
    where s.user_id = check_user_id
      and s.status = 'active'
      and (s.expires_at is null or s.expires_at > now())
  );
$$;

-- When access runs out, for the dashboard and the renewal nudge.
-- NULL means either no access at all or lifetime — callers pair this with
-- has_active_access() to tell those apart.
create or replace function public.access_expires_at(check_user_id uuid default auth.uid())
returns timestamptz
language sql
stable
security invoker
set search_path = public
as $$
  select max(s.expires_at)
  from public.subscriptions s
  where s.user_id = check_user_id
    and s.status = 'active'
    and (s.expires_at is null or s.expires_at > now());
$$;

grant execute on function public.access_expires_at(uuid) to authenticated;
