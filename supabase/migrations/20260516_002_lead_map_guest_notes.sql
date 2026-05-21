create table if not exists public.lead_map_guest_notes (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.lead_map_campaigns(id) on delete cascade,
  map_id uuid not null references ms.system_maps(id) on delete cascade,
  access_code_id uuid references public.lead_map_access_codes(id) on delete set null,
  author_email text not null,
  display_name text not null,
  body text not null,
  pos_x numeric not null,
  pos_y numeric not null,
  target_flow_id text,
  status text not null default 'pending',
  approved_at timestamptz,
  approved_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lead_map_guest_notes_status_check check (status in ('pending', 'approved', 'hidden')),
  constraint lead_map_guest_notes_display_name_check check (char_length(trim(display_name)) between 2 and 60),
  constraint lead_map_guest_notes_body_check check (char_length(trim(body)) between 1 and 1200)
);

create index if not exists idx_lead_map_guest_notes_campaign_status
  on public.lead_map_guest_notes (campaign_id, status, created_at desc);

create index if not exists idx_lead_map_guest_notes_map_position
  on public.lead_map_guest_notes (map_id, pos_x, pos_y);

create index if not exists idx_lead_map_guest_notes_access_code
  on public.lead_map_guest_notes (access_code_id);

drop trigger if exists trg_lead_map_guest_notes_updated_at on public.lead_map_guest_notes;
create trigger trg_lead_map_guest_notes_updated_at
before update on public.lead_map_guest_notes
for each row execute function public.touch_updated_at_public();

alter table public.lead_map_guest_notes enable row level security;

grant select, insert, update, delete on public.lead_map_guest_notes to service_role;
