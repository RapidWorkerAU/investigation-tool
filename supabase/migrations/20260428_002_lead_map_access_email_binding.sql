alter table public.lead_map_access_codes
  add column if not exists reserved_email text,
  add column if not exists generated_by_user_id uuid references auth.users(id) on delete set null,
  add column if not exists generated_at timestamptz not null default timezone('utc', now());

create unique index if not exists idx_lead_map_access_codes_active_reserved_email
  on public.lead_map_access_codes (campaign_id, reserved_email)
  where reserved_email is not null and redeemed_at is null and revoked_at is null;
