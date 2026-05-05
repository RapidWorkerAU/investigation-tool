create extension if not exists pgcrypto;

create table if not exists public.lead_map_campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  map_id uuid not null references ms.system_maps(id) on delete cascade,
  title text not null,
  description text,
  is_active boolean not null default true,
  session_duration_hours integer not null default 2,
  created_at timestamptz not null default timezone('utc', now()),
  constraint lead_map_campaigns_slug_format_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint lead_map_campaigns_session_duration_hours_check check (session_duration_hours between 1 and 24)
);

create table if not exists public.lead_map_access_codes (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.lead_map_campaigns(id) on delete cascade,
  code_hash text not null,
  code_last4 text,
  note text,
  redeemed_email text,
  redeemed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint lead_map_access_codes_code_hash_length_check check (char_length(code_hash) = 64),
  constraint lead_map_access_codes_redeemed_pair_check check (
    (redeemed_email is null and redeemed_at is null)
    or (redeemed_email is not null and redeemed_at is not null)
  ),
  unique (campaign_id, code_hash)
);

create index if not exists idx_lead_map_access_codes_campaign_redeemed
  on public.lead_map_access_codes (campaign_id, redeemed_at);

alter table public.lead_map_campaigns enable row level security;
alter table public.lead_map_access_codes enable row level security;
