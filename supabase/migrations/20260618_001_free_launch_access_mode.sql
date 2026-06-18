-- Temporary free launch mode.
-- To reinstate subscription protections later:
-- 1. replace public.free_access_mode_enabled() so it returns false
-- 2. set NEXT_PUBLIC_FREE_ACCESS_MODE=false in the app environment
-- 3. restore the public pricing/subscription links in the app UI

create or replace function public.free_access_mode_enabled()
returns boolean
language sql
stable
as $$
  select true;
$$;

revoke all on function public.free_access_mode_enabled() from public, anon;
grant execute on function public.free_access_mode_enabled() to authenticated, service_role;

create or replace function public.start_trial_access(p_user_id uuid)
returns public.billing_profiles
language plpgsql
security definer
set search_path = public, ms
as $$
declare
  v_existing_free_account uuid;
  v_access_period public.access_periods;
  v_profile public.billing_profiles;
begin
  select id
  into v_existing_free_account
  from public.access_periods
  where user_id = p_user_id
    and access_type = 'trial_7d'
  order by created_at asc
  limit 1;

  if v_existing_free_account is not null then
    update public.access_periods
    set
      access_status = 'active',
      starts_at = least(starts_at, now()),
      ends_at = 'infinity'::timestamptz,
      map_limit = case when public.free_access_mode_enabled() then null else 1 end,
      export_allowed = public.free_access_mode_enabled(),
      write_allowed = true,
      share_allowed = public.free_access_mode_enabled(),
      duplicate_allowed = public.free_access_mode_enabled(),
      notes = case when public.free_access_mode_enabled() then 'Free launch access' else 'Free account' end
    where id = v_existing_free_account
    returning * into v_access_period;

    v_profile := public.refresh_billing_profile_state(p_user_id);
    return v_profile;
  end if;

  insert into public.access_periods (
    user_id,
    access_type,
    access_status,
    access_source,
    starts_at,
    ends_at,
    map_limit,
    maps_allocated,
    export_allowed,
    write_allowed,
    share_allowed,
    duplicate_allowed,
    notes
  )
  values (
    p_user_id,
    'trial_7d',
    'active',
    'trial',
    now(),
    'infinity'::timestamptz,
    case when public.free_access_mode_enabled() then null else 1 end,
    0,
    public.free_access_mode_enabled(),
    true,
    public.free_access_mode_enabled(),
    public.free_access_mode_enabled(),
    case when public.free_access_mode_enabled() then 'Free launch access' else 'Free account' end
  )
  returning * into v_access_period;

  v_profile := public.refresh_billing_profile_state(p_user_id);

  return v_profile;
end;
$$;

revoke all on function public.start_trial_access(uuid) from public, anon, authenticated;
grant execute on function public.start_trial_access(uuid) to service_role;

create or replace function public.has_active_monthly_subscription(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public, auth
stable
as $$
  select
    p_user_id is not null
    and (
      auth.role() = 'service_role'
      or auth.uid() = p_user_id
    )
    and (
      public.free_access_mode_enabled()
      or public.is_platform_admin(p_user_id)
      or exists (
        select 1
        from public.access_periods ap
        where ap.user_id = p_user_id
          and ap.access_type = 'subscription_monthly'
          and ap.access_status = 'active'
          and now() >= ap.starts_at
          and now() < ap.ends_at
      )
    );
$$;

revoke all on function public.has_active_monthly_subscription(uuid) from public, anon;
grant execute on function public.has_active_monthly_subscription(uuid) to authenticated, service_role;

update public.access_periods
set
  access_status = 'active',
  ends_at = 'infinity'::timestamptz,
  map_limit = null,
  export_allowed = true,
  write_allowed = true,
  share_allowed = true,
  duplicate_allowed = true,
  notes = 'Free launch access'
where access_type = 'trial_7d'
  and public.free_access_mode_enabled();

update public.map_access_assignments maa
set
  access_mode = 'full_access',
  export_allowed = true,
  share_allowed = true,
  duplicate_allowed = true,
  writable_until = 'infinity'::timestamptz
from public.access_periods ap
where maa.access_period_id = ap.id
  and ap.access_type = 'trial_7d'
  and public.free_access_mode_enabled();

update ms.system_maps sm
set
  owner_access_mode = 'full_access',
  owner_access_expires_at = 'infinity'::timestamptz,
  owner_read_only_reason = null
from public.access_periods ap
where sm.created_via_access_period_id = ap.id
  and ap.access_type = 'trial_7d'
  and public.free_access_mode_enabled();
