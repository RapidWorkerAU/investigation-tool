-- Allow platform admins to create investigation maps without a paid access_period row.

create or replace function public.create_investigation_map(p_title text default null)
returns uuid
language plpgsql
security definer
set search_path = public, ms
as $$
declare
  v_user_id uuid;
  v_map_id uuid;
  v_title text;
  v_map_code text;
  v_chars constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_index integer;
  v_profile public.billing_profiles;
  v_period public.access_periods;
  v_active_map_count integer := 0;
  v_is_platform_admin boolean := false;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  v_is_platform_admin := public.is_platform_admin(v_user_id);
  v_profile := public.refresh_billing_profile_state(v_user_id);

  if v_profile.current_access_status <> 'active' then
    raise exception 'No active access period';
  end if;

  if not v_profile.can_create_maps then
    raise exception 'Map creation is not allowed for this access type';
  end if;

  if not v_is_platform_admin then
    select *
    into v_period
    from public.access_periods
    where id = v_profile.current_access_period_id;

    if v_period.id is null then
      raise exception 'Active access period not found';
    end if;

    if v_period.map_limit is not null then
      select count(*)
      into v_active_map_count
      from ms.system_maps sm
      where sm.owner_id = v_user_id
        and sm.map_category = 'incident_investigation'
        and sm.created_via_access_period_id = v_period.id;

      if v_active_map_count >= v_period.map_limit then
        raise exception 'This access period already has an active investigation map';
      end if;
    end if;
  end if;

  v_title := nullif(trim(coalesce(p_title, '')), '');
  if v_title is null then
    v_title := 'Untitled Investigation';
  end if;

  loop
    v_map_code := '';
    for i in 1..6 loop
      v_index := 1 + floor(random() * length(v_chars))::integer;
      v_map_code := v_map_code || substr(v_chars, v_index, 1);
    end loop;

    exit when not exists (
      select 1
      from ms.system_maps
      where map_code = v_map_code
    );
  end loop;

  insert into ms.system_maps (
    title,
    description,
    owner_id,
    map_code,
    map_category,
    created_via_access_period_id,
    owner_access_mode,
    owner_access_expires_at
  )
  values (
    v_title,
    null,
    v_user_id,
    v_map_code,
    'incident_investigation',
    case when v_is_platform_admin then null else v_period.id end,
    'full_access',
    case when v_is_platform_admin then null else v_period.ends_at end
  )
  returning id into v_map_id;

  insert into ms.map_members (map_id, user_id, role)
  values (v_map_id, v_user_id, 'full_write')
  on conflict (map_id, user_id) do update
    set role = excluded.role;

  if not v_is_platform_admin then
    insert into public.map_access_assignments (
      access_period_id,
      map_id,
      user_id,
      access_mode,
      export_allowed,
      share_allowed,
      duplicate_allowed,
      writable_from,
      writable_until
    )
    values (
      v_period.id,
      v_map_id,
      v_user_id,
      'full_access',
      v_period.export_allowed,
      v_period.share_allowed,
      v_period.duplicate_allowed,
      v_period.starts_at,
      v_period.ends_at
    )
    on conflict (access_period_id, map_id) do update
      set
        user_id = excluded.user_id,
        access_mode = excluded.access_mode,
        export_allowed = excluded.export_allowed,
        share_allowed = excluded.share_allowed,
        duplicate_allowed = excluded.duplicate_allowed,
        writable_from = excluded.writable_from,
        writable_until = excluded.writable_until;

    if v_period.map_limit is not null then
      update public.access_periods
      set maps_allocated = v_active_map_count + 1
      where id = v_period.id;
    end if;
  end if;

  perform public.refresh_billing_profile_state(v_user_id);

  return v_map_id;
end;
$$;

revoke all on function public.create_investigation_map(text) from public;
grant execute on function public.create_investigation_map(text) to authenticated;
