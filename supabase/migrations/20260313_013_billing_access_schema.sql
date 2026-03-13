-- 20260313_013_billing_access_schema.sql
-- Billing and access model for:
-- - 7 day trial
-- - 30 day single-investigation access pass
-- - ongoing monthly subscription
--
-- Design notes:
-- - public.billing_profiles: one current-state row per user for fast auth gating
-- - public.access_periods: historical and current access windows
-- - public.map_access_assignments: links maps to pass/trial windows for read-only behavior
-- - ms.system_maps.created_via_access_period_id: lets us track which purchase/trial produced a map
--
-- Important assumption:
-- - "choose access type" should trigger when no access has been selected yet.
-- - an ACTIVE 7 day trial should not be treated as "selection required".

create type public.access_type as enum (
  'trial_7d',
  'pass_30d',
  'subscription_monthly'
);

create type public.access_status as enum (
  'selection_required',
  'checkout_required',
  'pending_activation',
  'active',
  'expired',
  'payment_failed',
  'cancelled'
);

create type public.access_source as enum (
  'trial',
  'stripe_checkout',
  'stripe_subscription',
  'admin'
);

create type public.map_access_mode as enum (
  'read_only',
  'full_access'
);

create table if not exists public.billing_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  access_selection_required boolean not null default true,
  current_access_type public.access_type,
  current_access_status public.access_status not null default 'selection_required',
  current_access_period_id uuid,
  current_stripe_subscription_id text,
  current_stripe_price_id text,
  current_period_starts_at timestamptz,
  current_period_ends_at timestamptz,
  read_only_reason text,
  can_create_maps boolean not null default false,
  can_edit_maps boolean not null default false,
  can_export boolean not null default false,
  can_share_maps boolean not null default false,
  can_duplicate_maps boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.access_periods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  access_type public.access_type not null,
  access_status public.access_status not null,
  access_source public.access_source not null,
  stripe_checkout_session_id text,
  stripe_subscription_id text,
  stripe_invoice_id text,
  stripe_price_id text,
  stripe_payment_status text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  map_limit integer,
  maps_allocated integer not null default 0,
  export_allowed boolean not null default false,
  write_allowed boolean not null default false,
  share_allowed boolean not null default false,
  duplicate_allowed boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint access_periods_map_limit_check check (map_limit is null or map_limit >= 0),
  constraint access_periods_map_allocated_check check (maps_allocated >= 0)
);

create index if not exists idx_access_periods_user_dates
on public.access_periods (user_id, starts_at desc, ends_at desc);

create index if not exists idx_access_periods_subscription
on public.access_periods (stripe_subscription_id);

create table if not exists public.map_access_assignments (
  id uuid primary key default gen_random_uuid(),
  access_period_id uuid not null references public.access_periods(id) on delete cascade,
  map_id uuid not null references ms.system_maps(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  access_mode public.map_access_mode not null default 'full_access',
  export_allowed boolean not null default false,
  share_allowed boolean not null default false,
  duplicate_allowed boolean not null default false,
  writable_from timestamptz not null default now(),
  writable_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint map_access_assignments_unique unique (access_period_id, map_id)
);

create index if not exists idx_map_access_assignments_user_map
on public.map_access_assignments (user_id, map_id);

create index if not exists idx_map_access_assignments_period
on public.map_access_assignments (access_period_id);

alter table ms.system_maps
add column if not exists created_via_access_period_id uuid references public.access_periods(id) on delete set null;

alter table ms.system_maps
add column if not exists owner_access_mode public.map_access_mode not null default 'full_access';

alter table ms.system_maps
add column if not exists owner_access_expires_at timestamptz;

alter table ms.system_maps
add column if not exists owner_read_only_reason text;

create index if not exists idx_system_maps_created_via_access_period
on ms.system_maps (created_via_access_period_id);

alter table public.billing_profiles
add constraint billing_profiles_current_access_period_fk
foreign key (current_access_period_id)
references public.access_periods(id)
on delete set null;

create or replace function public.touch_updated_at_public()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_billing_profiles_updated_at on public.billing_profiles;
create trigger trg_billing_profiles_updated_at
before update on public.billing_profiles
for each row
execute function public.touch_updated_at_public();

drop trigger if exists trg_access_periods_updated_at on public.access_periods;
create trigger trg_access_periods_updated_at
before update on public.access_periods
for each row
execute function public.touch_updated_at_public();

drop trigger if exists trg_map_access_assignments_updated_at on public.map_access_assignments;
create trigger trg_map_access_assignments_updated_at
before update on public.map_access_assignments
for each row
execute function public.touch_updated_at_public();

alter table public.billing_profiles enable row level security;
alter table public.access_periods enable row level security;
alter table public.map_access_assignments enable row level security;

drop policy if exists billing_profiles_self_read on public.billing_profiles;
create policy billing_profiles_self_read on public.billing_profiles
for select to authenticated
using (user_id = auth.uid());

drop policy if exists billing_profiles_self_write on public.billing_profiles;
create policy billing_profiles_self_write on public.billing_profiles
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists access_periods_self_read on public.access_periods;
create policy access_periods_self_read on public.access_periods
for select to authenticated
using (user_id = auth.uid());

drop policy if exists map_access_assignments_self_read on public.map_access_assignments;
create policy map_access_assignments_self_read on public.map_access_assignments
for select to authenticated
using (user_id = auth.uid());

grant select, update on public.billing_profiles to authenticated;
grant select on public.access_periods to authenticated;
grant select on public.map_access_assignments to authenticated;

-- Seed a billing profile row for all existing users.
insert into public.billing_profiles (
  user_id,
  access_selection_required,
  current_access_status
)
select
  u.id,
  true,
  'selection_required'::public.access_status
from auth.users u
left join public.billing_profiles bp
  on bp.user_id = u.id
where bp.user_id is null;

-- Auto-create a billing profile row for new auth users.
create or replace function public.create_billing_profile_for_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.billing_profiles (
    user_id,
    access_selection_required,
    current_access_status
  )
  values (
    new.id,
    true,
    'selection_required'
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_create_billing_profile_for_new_auth_user on auth.users;
create trigger trg_create_billing_profile_for_new_auth_user
after insert on auth.users
for each row
execute function public.create_billing_profile_for_new_auth_user();

comment on table public.billing_profiles is
'One row per user for fast runtime checks: auth gating, current access type, current access status, read-only reason, and feature flags.';

comment on table public.access_periods is
'Historical and current access windows: 7 day trials, 30 day passes, and recurring monthly subscription periods.';

comment on table public.map_access_assignments is
'Links maps to access windows so pass/trial-created maps can become read-only after expiry while remaining visible.';
