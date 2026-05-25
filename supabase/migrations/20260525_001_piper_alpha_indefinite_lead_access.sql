alter table public.lead_map_campaigns
  drop constraint if exists lead_map_campaigns_session_duration_hours_check;

alter table public.lead_map_campaigns
  add constraint lead_map_campaigns_session_duration_hours_check
  check (session_duration_hours between 0 and 24);

comment on column public.lead_map_campaigns.session_duration_hours is
  'Guest session length in hours. Use 0 for no app-level expiry; matching email and access code are still required.';

update public.lead_map_campaigns
set session_duration_hours = 0
where slug = 'piper-alpha';
