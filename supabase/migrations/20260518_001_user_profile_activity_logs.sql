-- Admin-visible user profile activity and email log.
-- This intentionally excludes canvas-level edits. It is for account, map, report,
-- PDF, and email lifecycle events that should be visible on the admin user page.

create table if not exists public.user_profile_activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  status text not null default 'success',
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint user_profile_activity_logs_status_check check (status in ('success', 'failed', 'info'))
);

create index if not exists idx_user_profile_activity_logs_user_created
on public.user_profile_activity_logs (user_id, created_at desc);

create index if not exists idx_user_profile_activity_logs_actor_created
on public.user_profile_activity_logs (actor_user_id, created_at desc);

alter table public.user_profile_activity_logs enable row level security;

drop policy if exists user_profile_activity_logs_no_client_access on public.user_profile_activity_logs;
create policy user_profile_activity_logs_no_client_access on public.user_profile_activity_logs
for all to authenticated
using (false)
with check (false);

comment on table public.user_profile_activity_logs is
'Admin-visible account activity and email log. Canvas node edits are intentionally not tracked here.';
