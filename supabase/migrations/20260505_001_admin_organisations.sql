create table if not exists public.organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text unique,
  description text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  billing_plan_name text,
  billing_notes text,
  account_owner_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organisations add column if not exists status text;
alter table public.organisations add column if not exists billing_plan_name text;
alter table public.organisations add column if not exists billing_notes text;
alter table public.organisations add column if not exists account_owner_user_id uuid references auth.users(id) on delete set null;
alter table public.organisations alter column status set default 'active';
update public.organisations set status = 'active' where status is null;
alter table public.organisations alter column status set not null;
alter table public.organisations drop constraint if exists organisations_status_check;
alter table public.organisations add constraint organisations_status_check check (status in ('active', 'inactive'));

create table if not exists public.organisation_departments (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisation_id, name)
);

create table if not exists public.organisation_sites (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisation_id, name)
);

create table if not exists public.organisation_memberships (
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'general_user' check (role in ('org_admin', 'general_user')),
  department_id uuid references public.organisation_departments(id) on delete set null,
  site_id uuid references public.organisation_sites(id) on delete set null,
  leader_user_id uuid references auth.users(id) on delete set null,
  invite_status text not null default 'active' check (invite_status in ('draft', 'invited', 'active', 'suspended')),
  invited_at timestamptz,
  joined_at timestamptz,
  suspended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organisation_id, user_id)
);

alter table public.organisation_memberships add column if not exists department_id uuid references public.organisation_departments(id) on delete set null;
alter table public.organisation_memberships add column if not exists site_id uuid references public.organisation_sites(id) on delete set null;
alter table public.organisation_memberships add column if not exists leader_user_id uuid references auth.users(id) on delete set null;
alter table public.organisation_memberships add column if not exists invite_status text;
alter table public.organisation_memberships add column if not exists invited_at timestamptz;
alter table public.organisation_memberships add column if not exists joined_at timestamptz;
alter table public.organisation_memberships add column if not exists suspended_at timestamptz;
alter table public.organisation_memberships alter column role set default 'general_user';
update public.organisation_memberships
set role = case
  when role in ('admin', 'manager') then 'org_admin'
  else 'general_user'
end
where role is distinct from case
  when role in ('admin', 'manager') then 'org_admin'
  else 'general_user'
end;
update public.organisation_memberships set invite_status = 'active' where invite_status is null;
alter table public.organisation_memberships alter column invite_status set default 'active';
alter table public.organisation_memberships alter column invite_status set not null;
alter table public.organisation_memberships drop constraint if exists organisation_memberships_role_check;
alter table public.organisation_memberships add constraint organisation_memberships_role_check check (role in ('org_admin', 'general_user'));
alter table public.organisation_memberships drop constraint if exists organisation_memberships_invite_status_check;
alter table public.organisation_memberships add constraint organisation_memberships_invite_status_check check (invite_status in ('draft', 'invited', 'active', 'suspended'));

create table if not exists public.organisation_invites (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'general_user' check (role in ('org_admin', 'general_user')),
  department_id uuid references public.organisation_departments(id) on delete set null,
  site_id uuid references public.organisation_sites(id) on delete set null,
  leader_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  invite_token uuid not null default gen_random_uuid(),
  invited_by_user_id uuid references auth.users(id) on delete set null,
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  revoked_at timestamptz,
  auth_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_organisation_memberships_user on public.organisation_memberships(user_id);
create index if not exists idx_organisation_memberships_organisation on public.organisation_memberships(organisation_id);
create index if not exists idx_organisation_memberships_leader on public.organisation_memberships(leader_user_id);
create index if not exists idx_organisation_departments_organisation on public.organisation_departments(organisation_id);
create index if not exists idx_organisation_sites_organisation on public.organisation_sites(organisation_id);
create index if not exists idx_organisation_invites_organisation on public.organisation_invites(organisation_id);
create index if not exists idx_organisation_invites_email on public.organisation_invites(email);

create or replace function public.accept_pending_organisation_invites(
  p_user_id uuid,
  p_email text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
begin
  update public.organisation_invites
  set
    status = 'accepted',
    accepted_at = coalesce(accepted_at, v_now),
    auth_user_id = p_user_id,
    updated_at = v_now
  where lower(email) = lower(coalesce(p_email, ''))
    and status = 'pending';

  insert into public.organisation_memberships (
    organisation_id,
    user_id,
    role,
    department_id,
    site_id,
    leader_user_id,
    invite_status,
    invited_at,
    joined_at
  )
  select
    oi.organisation_id,
    p_user_id,
    oi.role,
    oi.department_id,
    oi.site_id,
    oi.leader_user_id,
    'active',
    oi.invited_at,
    v_now
  from public.organisation_invites oi
  where oi.auth_user_id = p_user_id
    and oi.status = 'accepted'
  on conflict (organisation_id, user_id)
  do update set
    role = excluded.role,
    department_id = excluded.department_id,
    site_id = excluded.site_id,
    leader_user_id = excluded.leader_user_id,
    invite_status = 'active',
    joined_at = coalesce(public.organisation_memberships.joined_at, excluded.joined_at),
    updated_at = v_now;
end;
$$;

drop trigger if exists trg_organisations_updated_at on public.organisations;
create trigger trg_organisations_updated_at
before update on public.organisations
for each row execute function ms.touch_updated_at();

drop trigger if exists trg_organisation_departments_updated_at on public.organisation_departments;
create trigger trg_organisation_departments_updated_at
before update on public.organisation_departments
for each row execute function ms.touch_updated_at();

drop trigger if exists trg_organisation_sites_updated_at on public.organisation_sites;
create trigger trg_organisation_sites_updated_at
before update on public.organisation_sites
for each row execute function ms.touch_updated_at();

drop trigger if exists trg_organisation_memberships_updated_at on public.organisation_memberships;
create trigger trg_organisation_memberships_updated_at
before update on public.organisation_memberships
for each row execute function ms.touch_updated_at();

drop trigger if exists trg_organisation_invites_updated_at on public.organisation_invites;
create trigger trg_organisation_invites_updated_at
before update on public.organisation_invites
for each row execute function ms.touch_updated_at();

alter table public.organisations enable row level security;
alter table public.organisation_departments enable row level security;
alter table public.organisation_sites enable row level security;
alter table public.organisation_memberships enable row level security;
alter table public.organisation_invites enable row level security;

grant select, insert, update, delete on public.organisations to authenticated;
grant select, insert, update, delete on public.organisation_departments to authenticated;
grant select, insert, update, delete on public.organisation_sites to authenticated;
grant select, insert, update, delete on public.organisation_memberships to authenticated;
grant select, insert, update, delete on public.organisation_invites to authenticated;

revoke all on function public.accept_pending_organisation_invites(uuid, text) from public;
grant execute on function public.accept_pending_organisation_invites(uuid, text) to authenticated;
