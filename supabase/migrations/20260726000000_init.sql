-- ============================================================================
-- Sprint 0 — initial schema
--
-- Tables: users, subscriptions, courses, chapters   (plan §11.5)
--
-- Row Level Security is enabled in THIS migration, not a later one.
-- CLAUDE.md #17: RLS on every user-scoped table from the first migration.
-- Retrofitting RLS onto a table that already has rows and client code reading
-- it is materially harder than doing it here.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

-- Note: "monthly" is a ONE-TIME 30-day grant, not a recurring subscription.
-- See CLAUDE.md "Pricing model". Entitlement is "unexpired access", never
-- "has an active Stripe subscription".
create type public.subscription_tier as enum ('monthly', 'annual', 'lifetime');

create type public.subscription_status as enum ('active', 'expired', 'refunded', 'pending');

-- ---------------------------------------------------------------------------
-- Shared trigger function: keep updated_at honest
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- users — public mirror of auth.users
--
-- auth.users is owned by Supabase and cannot carry app columns or be joined
-- from client queries. This mirror is the table application code references.
-- ---------------------------------------------------------------------------

create table public.users (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text        not null,
  name        text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.users is
  'Application-visible mirror of auth.users, populated by the handle_new_user trigger.';

create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- Populate the mirror whenever Supabase Auth creates a user. SECURITY DEFINER
-- because the trigger runs in the auth schema's context, which has no rights
-- on public.users.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'user_name'
    ),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )
  )
  on conflict (id) do update
    set email      = excluded.email,
        name       = coalesce(excluded.name, public.users.name),
        avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep email in sync when the user changes it via Supabase Auth.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- ---------------------------------------------------------------------------
-- subscriptions — entitlement records
--
-- One row per purchase. Access is the union of unexpired rows, so a user who
-- buys three monthly passes simply has three rows and access until the latest
-- expires_at. expires_at IS NULL means lifetime.
-- ---------------------------------------------------------------------------

create table public.subscriptions (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references public.users (id) on delete cascade,
  tier                     public.subscription_tier   not null,
  status                   public.subscription_status not null default 'pending',
  stripe_customer_id       text,
  stripe_checkout_id       text unique,   -- idempotency key for webhook replay
  stripe_payment_intent_id text,
  amount_cents             integer check (amount_cents is null or amount_cents >= 0),
  currency                 text default 'usd',
  starts_at                timestamptz not null default now(),
  expires_at               timestamptz,   -- NULL = lifetime, never expires
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),

  -- A lifetime purchase must not carry an expiry; anything else must.
  constraint subscriptions_expiry_matches_tier check (
    (tier = 'lifetime' and expires_at is null)
    or (tier <> 'lifetime' and expires_at is not null)
  )
);

comment on column public.subscriptions.expires_at is
  'NULL means lifetime. Entitlement asks "is there an active row that has not expired", never "is there an active Stripe subscription".';
comment on column public.subscriptions.stripe_checkout_id is
  'Unique so replayed Stripe webhooks cannot double-grant access.';

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

create index subscriptions_user_id_idx on public.subscriptions (user_id);
create index subscriptions_active_idx
  on public.subscriptions (user_id, expires_at)
  where status = 'active';

-- ---------------------------------------------------------------------------
-- courses
-- ---------------------------------------------------------------------------

create table public.courses (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  description  text,
  order_index  integer not null default 0,
  is_premium   boolean not null default true,
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint courses_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create trigger courses_set_updated_at
  before update on public.courses
  for each row execute function public.set_updated_at();

create index courses_published_idx on public.courses (published_at, order_index);

-- ---------------------------------------------------------------------------
-- chapters
--
-- mdx_path points at the file under /content. MDX is the source of truth for
-- prose; this table is the index used for ordering, navigation and gating.
-- ---------------------------------------------------------------------------

create table public.chapters (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid not null references public.courses (id) on delete cascade,
  slug         text not null,
  title        text not null,
  description  text,
  mdx_path     text not null,
  order_index  integer not null default 0,
  is_free      boolean not null default false,
  reading_time integer check (reading_time is null or reading_time > 0),
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  unique (course_id, slug),
  constraint chapters_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create trigger chapters_set_updated_at
  before update on public.chapters
  for each row execute function public.set_updated_at();

create index chapters_course_order_idx on public.chapters (course_id, order_index);

-- ---------------------------------------------------------------------------
-- Entitlement helper
--
-- Defined now rather than in Sprint 3 because the shape of this question
-- ("unexpired access", not "active subscription") is a data-model decision the
-- plan is explicit about. The Stripe wiring that writes these rows comes later.
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

-- ============================================================================
-- Row Level Security
--
-- Enabled on every table. The service_role key bypasses RLS entirely, which is
-- how the Stripe webhook will write subscription rows in Sprint 3 — clients
-- are never granted write access to entitlements.
-- ============================================================================

alter table public.users         enable row level security;
alter table public.subscriptions enable row level security;
alter table public.courses       enable row level security;
alter table public.chapters      enable row level security;

-- Deny by default: no policy means no access. Policies below are additive.

-- --- users -----------------------------------------------------------------

create policy "users: read own row"
  on public.users for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "users: update own row"
  on public.users for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- No insert policy: rows are created only by the handle_new_user trigger.
-- No delete policy: account deletion cascades from auth.users.

-- --- subscriptions ---------------------------------------------------------

create policy "subscriptions: read own rows"
  on public.subscriptions for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Deliberately no insert/update/delete policies for authenticated users.
-- If a client could write here it could grant itself lifetime access.
-- Only the service_role key (webhook handler) writes to this table.

-- --- courses / chapters ----------------------------------------------------
-- Not user-scoped, but RLS is still on so unpublished drafts cannot be read
-- by enumerating the API before they ship.

create policy "courses: public read published"
  on public.courses for select
  to anon, authenticated
  using (published_at is not null and published_at <= now());

create policy "chapters: public read published"
  on public.chapters for select
  to anon, authenticated
  using (
    published_at is not null
    and published_at <= now()
    and exists (
      select 1 from public.courses c
      where c.id = chapters.course_id
        and c.published_at is not null
        and c.published_at <= now()
    )
  );

-- ---------------------------------------------------------------------------
-- Grants
--
-- RLS only filters rows the role can already reach, so table privileges still
-- have to be narrowed. anon and authenticated get no write access anywhere.
-- ---------------------------------------------------------------------------

revoke all on public.users, public.subscriptions, public.courses, public.chapters
  from anon, authenticated;

grant select on public.courses, public.chapters to anon, authenticated;
grant select on public.subscriptions to authenticated;
grant select, update on public.users to authenticated;

grant execute on function public.has_active_access(uuid) to authenticated;
