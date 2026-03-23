-- Ensure 30 day access respects a single map allocation across create/link actions
-- and disables duplication for pass holders.

update public.access_periods
set duplicate_allowed = false
where access_type = 'pass_30d';

create or replace function public.refresh_billing_profile_state(p_user_id uuid)
returns public.billing_profiles
language plpgsql
security definer
set search_path = public, ms
as $$
declare
  v_profile public.billing_profiles;
  v_active_period public.access_periods;
  v_latest_period public.access_periods;
  v_read_only_reason text;
  v_active_assignment_count integer := 0;
  v_effective_status public.access_status;
begin
  insert into public.billing_profiles (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  if public.is_platform_admin(p_user_id) then
    update public.billing_profiles bp
    set
      access_selection_required = false,
      current_access_type = 'subscription_monthly',
      current_access_status = 'active',
      current_access_period_id = null,
      current_stripe_subscription_id = null,
      current_stripe_price_id = null,
      current_period_starts_at = null,
      current_period_ends_at = null,
      read_only_reason = null,
      can_create_maps = true,
      can_edit_maps = true,
      can_export = true,
      can_share_maps = true,
      can_duplicate_maps = true
    where bp.user_id = p_user_id
    returning * into v_profile;

    return v_profile;
  end if;

  select *
  into v_active_period
  from public.access_periods ap
  where ap.user_id = p_user_id
    and ap.access_status = 'active'
    and now() >= ap.starts_at
    and now() < ap.ends_at
  order by ap.ends_at desc, ap.created_at desc
  limit 1;

  if v_active_period.id is not null then
    if v_active_period.map_limit is not null then
      select count(*)
      into v_active_assignment_count
      from public.map_access_assignments maa
      join ms.system_maps sm
        on sm.id = maa.map_id
      where maa.access_period_id = v_active_period.id
        and maa.user_id = p_user_id
        and sm.map_category = 'incident_investigation';
    end if;

    update public.billing_profiles bp
    set
      access_selection_required = false,
      current_access_type = v_active_period.access_type,
      current_access_status = 'active',
      current_access_period_id = v_active_period.id,
      current_stripe_subscription_id = v_active_period.stripe_subscription_id,
      current_stripe_price_id = v_active_period.stripe_price_id,
      current_period_starts_at = v_active_period.starts_at,
      current_period_ends_at = v_active_period.ends_at,
      read_only_reason = null,
      can_create_maps = v_active_period.write_allowed
        and (
          v_active_period.map_limit is null
          or v_active_assignment_count < v_active_period.map_limit
        ),
      can_edit_maps = v_active_period.write_allowed,
      can_export = v_active_period.export_allowed,
      can_share_maps = v_active_period.share_allowed
        and (
          v_active_period.map_limit is null
          or v_active_assignment_count < v_active_period.map_limit
        ),
      can_duplicate_maps = v_active_period.duplicate_allowed
        and v_active_period.access_type <> 'pass_30d'
    where bp.user_id = p_user_id
    returning * into v_profile;

    return v_profile;
  end if;

  select *
  into v_latest_period
  from public.access_periods ap
  where ap.user_id = p_user_id
  order by greatest(ap.ends_at, ap.starts_at) desc, ap.created_at desc
  limit 1;

  if v_latest_period.id is null then
    update public.billing_profiles bp
    set
      access_selection_required = true,
      current_access_type = null,
      current_access_status = 'selection_required',
      current_access_period_id = null,
      current_stripe_subscription_id = null,
      current_stripe_price_id = null,
      current_period_starts_at = null,
      current_period_ends_at = null,
      read_only_reason = null,
      can_create_maps = false,
      can_edit_maps = false,
      can_export = false,
      can_share_maps = false,
      can_duplicate_maps = false
    where bp.user_id = p_user_id
    returning * into v_profile;

    return v_profile;
  end if;

  v_effective_status := v_latest_period.access_status;

  if v_effective_status = 'active' and now() >= v_latest_period.ends_at then
    v_effective_status := 'expired';
  end if;

  v_read_only_reason :=
    case v_effective_status
      when 'payment_failed' then 'Payment failed. Your maps are read only until billing is updated.'
      when 'expired' then 'Your access period has expired. Your maps are read only.'
      when 'cancelled' then 'Your access has been cancelled. Your maps are read only.'
      when 'pending_activation' then 'Your access is still being activated.'
      else 'Access is restricted until an active access type is available.'
    end;

  update public.billing_profiles bp
  set
    access_selection_required = false,
    current_access_type = v_latest_period.access_type,
    current_access_status = v_effective_status,
    current_access_period_id = v_latest_period.id,
    current_stripe_subscription_id = v_latest_period.stripe_subscription_id,
    current_stripe_price_id = v_latest_period.stripe_price_id,
    current_period_starts_at = v_latest_period.starts_at,
    current_period_ends_at = v_latest_period.ends_at,
    read_only_reason = v_read_only_reason,
    can_create_maps = false,
    can_edit_maps = false,
    can_export = false,
    can_share_maps = false,
    can_duplicate_maps = false
  where bp.user_id = p_user_id
  returning * into v_profile;

  return v_profile;
end;
$$;

create or replace function ms.link_map_to_profile_by_code(p_map_code text)
returns void
language plpgsql
security definer
set search_path = public, ms
as $$
declare
  v_user_id uuid := auth.uid();
  v_code text := upper(nullif(btrim(coalesce(p_map_code, '')), ''));
  v_profile public.billing_profiles;
  v_period public.access_periods;
  v_map ms.system_maps;
  v_existing_assignment boolean := false;
  v_active_assignment_count integer := 0;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if v_code is null then
    raise exception 'Map code is required';
  end if;

  select *
  into v_profile
  from public.refresh_billing_profile_state(v_user_id);

  if v_profile.current_access_status <> 'active' then
    raise exception 'No active access period';
  end if;

  select *
  into v_period
  from public.access_periods
  where id = v_profile.current_access_period_id;

  if v_period.id is null then
    raise exception 'Active access period not found';
  end if;

  if not v_profile.can_share_maps then
    if v_profile.current_access_type = 'pass_30d' then
      raise exception 'Your 30 Day Access has already used its single map allocation. Linking a map by code counts toward that limit.';
    end if;

    raise exception 'Map linking is not available for your current access';
  end if;

  select *
  into v_map
  from ms.system_maps sm
  where upper(coalesce(sm.map_code, '')) = v_code
    and sm.map_category = 'incident_investigation'
  limit 1;

  if v_map.id is null then
    raise exception 'No investigation map was found for that map code';
  end if;

  if exists (
    select 1
    from ms.map_members mm
    where mm.map_id = v_map.id
      and mm.user_id = v_user_id
  ) then
    return;
  end if;

  if v_period.map_limit is not null then
    select count(*)
    into v_active_assignment_count
    from public.map_access_assignments maa
    join ms.system_maps sm
      on sm.id = maa.map_id
    where maa.access_period_id = v_period.id
      and maa.user_id = v_user_id
      and sm.map_category = 'incident_investigation';

    if v_active_assignment_count >= v_period.map_limit then
      raise exception 'Your 30 Day Access has already used its single map allocation. Linking a map by code counts toward that limit.';
    end if;
  end if;

  insert into ms.map_members (map_id, user_id, role)
  values (v_map.id, v_user_id, 'full_write')
  on conflict (map_id, user_id) do update
    set role = excluded.role;

  select exists (
    select 1
    from public.map_access_assignments maa
    where maa.access_period_id = v_period.id
      and maa.map_id = v_map.id
  )
  into v_existing_assignment;

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
    v_map.id,
    v_user_id,
    'full_access',
    v_period.export_allowed,
    v_period.share_allowed,
    false,
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

  perform public.refresh_billing_profile_state(v_user_id);
end;
$$;

revoke all on function ms.link_map_to_profile_by_code(text) from public;
grant execute on function ms.link_map_to_profile_by_code(text) to authenticated;

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
  v_active_assignment_count integer := 0;
  v_is_platform_admin boolean := false;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  v_is_platform_admin := public.is_platform_admin(v_user_id);

  select *
  into v_profile
  from public.refresh_billing_profile_state(v_user_id);

  if not v_is_platform_admin and v_profile.current_access_status <> 'active' then
    raise exception 'No active access period';
  end if;

  if not v_is_platform_admin and not v_profile.can_create_maps then
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
      into v_active_assignment_count
      from public.map_access_assignments maa
      join ms.system_maps sm
        on sm.id = maa.map_id
      where maa.access_period_id = v_period.id
        and maa.user_id = v_user_id
        and sm.map_category = 'incident_investigation';

      if v_active_assignment_count >= v_period.map_limit then
        raise exception 'This access type has no remaining map allocations';
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
      false,
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
  end if;

  perform public.refresh_billing_profile_state(v_user_id);

  return v_map_id;
end;
$$;

revoke all on function public.create_investigation_map(text) from public;
grant execute on function public.create_investigation_map(text) to authenticated;
