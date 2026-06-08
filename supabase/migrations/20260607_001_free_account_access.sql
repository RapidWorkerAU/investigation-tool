-- Convert the former 7 day trial into a persistent free account.
-- The existing access_type value remains trial_7d for compatibility with
-- historical rows, RPC callers, and feature-gating code.

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
  v_active_map_count integer := 0;
  v_existing_map_id uuid;
  v_existing_map_count integer := 0;
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
  order by
    case ap.access_type
      when 'subscription_monthly' then 3
      when 'pass_30d' then 2
      when 'trial_7d' then 1
      else 0
    end desc,
    ap.ends_at desc,
    ap.created_at desc
  limit 1;

  if v_active_period.id is not null then
    if v_active_period.access_type = 'pass_30d' then
      select count(*), (array_agg(sm.id order by sm.updated_at desc, sm.created_at desc))[1]
      into v_existing_map_count, v_existing_map_id
      from ms.system_maps sm
      where sm.owner_id = p_user_id
        and sm.map_category = 'incident_investigation'
        and coalesce(sm.is_template_editor, false) = false;

      if v_existing_map_count = 1
        and not exists (
          select 1
          from public.map_access_assignments maa
          where maa.access_period_id = v_active_period.id
            and maa.user_id = p_user_id
            and maa.access_mode = 'full_access'
        )
      then
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
          v_active_period.id,
          v_existing_map_id,
          p_user_id,
          'full_access',
          v_active_period.export_allowed,
          v_active_period.share_allowed,
          false,
          v_active_period.starts_at,
          v_active_period.ends_at
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

        update ms.system_maps
        set
          owner_access_mode = 'full_access',
          owner_access_expires_at = v_active_period.ends_at,
          owner_read_only_reason = null
        where id = v_existing_map_id
          and owner_id = p_user_id;
      end if;
    end if;

    if v_active_period.map_limit is not null then
      select count(*)
      into v_active_map_count
      from ms.system_maps sm
      join public.map_access_assignments maa
        on maa.map_id = sm.id
       and maa.access_period_id = v_active_period.id
       and maa.user_id = p_user_id
       and maa.access_mode = 'full_access'
      where sm.owner_id = p_user_id
        and sm.map_category = 'incident_investigation'
        and coalesce(sm.is_template_editor, false) = false;
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
          or v_active_map_count < v_active_period.map_limit
        ),
      can_edit_maps = v_active_period.write_allowed,
      can_export = v_active_period.export_allowed,
      can_share_maps = v_active_period.share_allowed,
      can_duplicate_maps = v_active_period.duplicate_allowed
    where bp.user_id = p_user_id
    returning * into v_profile;

    return v_profile;
  end if;

  select *
  into v_latest_period
  from public.access_periods ap
  where ap.user_id = p_user_id
  order by
    case ap.access_type
      when 'subscription_monthly' then 3
      when 'pass_30d' then 2
      when 'trial_7d' then 1
      else 0
    end desc,
    greatest(ap.ends_at, ap.starts_at) desc,
    ap.created_at desc
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

revoke all on function public.refresh_billing_profile_state(uuid) from public, anon;
grant execute on function public.refresh_billing_profile_state(uuid) to authenticated, service_role;

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
      map_limit = 1,
      export_allowed = false,
      write_allowed = true,
      share_allowed = false,
      duplicate_allowed = false,
      notes = 'Free account'
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
    1,
    0,
    false,
    true,
    false,
    false,
    'Free account'
  )
  returning * into v_access_period;

  v_profile := public.refresh_billing_profile_state(p_user_id);

  return v_profile;
end;
$$;

revoke all on function public.start_trial_access(uuid) from public, anon, authenticated;
grant execute on function public.start_trial_access(uuid) to service_role;

create or replace function public.user_can_edit_map(p_map_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, ms, auth
as $$
  with map_role as (
    select
      sm.id,
      sm.owner_id,
      coalesce(mm.role, case when sm.owner_id = p_user_id then 'full_write' end) as role
    from ms.system_maps sm
    left join ms.map_members mm
      on mm.map_id = sm.id
     and mm.user_id = p_user_id
    where sm.id = p_map_id
  ),
  eligible_map as (
    select *
    from map_role
    where p_user_id is not null
      and (
        auth.role() = 'service_role'
        or auth.uid() = p_user_id
      )
      and (
        owner_id = p_user_id
        or role in ('partial_write', 'full_write')
      )
  )
  select exists (
    select 1
    from eligible_map em
    where
      public.is_platform_admin(p_user_id)
      or public.has_active_monthly_subscription(p_user_id)
      or public.user_has_active_org_access(p_user_id)
      or exists (
        select 1
        from public.billing_profiles bp
        join public.access_periods ap
          on ap.id = bp.current_access_period_id
        join public.map_access_assignments maa
          on maa.access_period_id = ap.id
         and maa.map_id = em.id
         and maa.user_id = p_user_id
        where bp.user_id = p_user_id
          and bp.current_access_status = 'active'
          and ap.access_status = 'active'
          and ap.access_type in ('trial_7d', 'pass_30d')
          and now() >= ap.starts_at
          and now() < ap.ends_at
          and maa.access_mode = 'full_access'
          and now() >= maa.writable_from
          and (maa.writable_until is null or now() < maa.writable_until)
      )
  );
$$;

revoke all on function public.user_can_edit_map(uuid, uuid) from public, anon;
grant execute on function public.user_can_edit_map(uuid, uuid) to authenticated, service_role;

create or replace function public.create_investigation_map(
  p_title text,
  p_replace_current_access_map boolean
)
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
  v_has_org_managed_access boolean := false;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  v_is_platform_admin := public.is_platform_admin(v_user_id);
  v_has_org_managed_access := public.user_has_active_org_access(v_user_id);

  select *
  into v_profile
  from public.refresh_billing_profile_state(v_user_id);

  if not v_is_platform_admin and not v_has_org_managed_access and v_profile.current_access_status <> 'active' then
    raise exception 'No active access period';
  end if;

  if not v_is_platform_admin and not v_has_org_managed_access and not v_profile.can_create_maps then
    if v_profile.current_access_type = 'pass_30d' and p_replace_current_access_map then
      null;
    else
      raise exception 'Map creation is not allowed for this access type';
    end if;
  end if;

  if not v_is_platform_admin and not v_has_org_managed_access then
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
        and maa.access_mode = 'full_access'
        and sm.map_category = 'incident_investigation';

      if v_active_assignment_count >= v_period.map_limit then
        if v_period.access_type = 'pass_30d' and p_replace_current_access_map then
          update public.map_access_assignments
          set
            access_mode = 'read_only',
            export_allowed = false,
            share_allowed = false,
            duplicate_allowed = false,
            writable_until = now()
          where access_period_id = v_period.id
            and user_id = v_user_id
            and access_mode = 'full_access';

          update ms.system_maps sm
          set
            owner_access_mode = 'read_only',
            owner_read_only_reason = 'This map was replaced by a new 30 Day Access map.'
          from public.map_access_assignments maa
          where maa.access_period_id = v_period.id
            and maa.user_id = v_user_id
            and maa.map_id = sm.id
            and sm.owner_id = v_user_id
            and sm.map_category = 'incident_investigation';
        else
          raise exception 'This access type has no remaining map allocations';
        end if;
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
    owner_access_expires_at,
    owner_read_only_reason
  )
  values (
    v_title,
    null,
    v_user_id,
    v_map_code,
    'incident_investigation',
    case when v_is_platform_admin or v_has_org_managed_access then null else v_period.id end,
    'full_access',
    case when v_is_platform_admin or v_has_org_managed_access then null else v_period.ends_at end,
    null
  )
  returning id into v_map_id;

  insert into ms.map_members (map_id, user_id, role)
  values (v_map_id, v_user_id, 'full_write')
  on conflict (map_id, user_id) do update
    set role = excluded.role;

  if not v_is_platform_admin and not v_has_org_managed_access then
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

create or replace function public.create_investigation_map(p_title text default null)
returns uuid
language sql
security definer
set search_path = public, ms
as $$
  select public.create_investigation_map(p_title, false);
$$;

revoke all on function public.create_investigation_map(text, boolean) from public, anon;
grant execute on function public.create_investigation_map(text, boolean) to authenticated;
revoke all on function public.create_investigation_map(text) from public, anon;
grant execute on function public.create_investigation_map(text) to authenticated;

drop policy if exists system_maps_update_delete_owner on ms.system_maps;
drop policy if exists system_maps_delete_owner on ms.system_maps;
create policy system_maps_update_editable on ms.system_maps
for update to authenticated
using (public.user_can_edit_map(id, auth.uid()))
with check (public.user_can_edit_map(id, auth.uid()));

create policy system_maps_delete_editable_owner on ms.system_maps
for delete to authenticated
using (owner_id = auth.uid() and public.user_can_edit_map(id, auth.uid()));

drop policy if exists map_members_owner_manage on ms.map_members;
create policy map_members_editable_owner_manage on ms.map_members
for all to authenticated
using (
  exists (
    select 1
    from ms.system_maps sm
    where sm.id = map_members.map_id
      and sm.owner_id = auth.uid()
      and public.user_can_edit_map(sm.id, auth.uid())
  )
)
with check (
  exists (
    select 1
    from ms.system_maps sm
    where sm.id = map_members.map_id
      and sm.owner_id = auth.uid()
      and public.user_can_edit_map(sm.id, auth.uid())
  )
);

drop policy if exists document_types_owner_write on ms.document_types;
create policy document_types_editable_write on ms.document_types
for all to authenticated
using (public.user_can_edit_map(map_id, auth.uid()))
with check (public.user_can_edit_map(map_id, auth.uid()));

drop policy if exists document_nodes_write on ms.document_nodes;
create policy document_nodes_editable_write on ms.document_nodes
for all to authenticated
using (public.user_can_edit_map(map_id, auth.uid()))
with check (public.user_can_edit_map(map_id, auth.uid()));

drop policy if exists canvas_elements_write on ms.canvas_elements;
create policy canvas_elements_editable_write on ms.canvas_elements
for all to authenticated
using (public.user_can_edit_map(map_id, auth.uid()))
with check (public.user_can_edit_map(map_id, auth.uid()));

drop policy if exists node_relations_write on ms.node_relations;
create policy node_relations_editable_write on ms.node_relations
for all to authenticated
using (public.user_can_edit_map(map_id, auth.uid()))
with check (public.user_can_edit_map(map_id, auth.uid()));

drop policy if exists outline_write on ms.document_outline_items;
create policy outline_editable_write on ms.document_outline_items
for all to authenticated
using (public.user_can_edit_map(map_id, auth.uid()))
with check (public.user_can_edit_map(map_id, auth.uid()));

drop policy if exists "systemmap storage write" on storage.objects;
create policy "systemmap storage write" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'systemmap'
  and name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/'
  and public.user_can_edit_map(((storage.foldername(name))[1])::uuid, auth.uid())
);

drop policy if exists "systemmap storage update" on storage.objects;
create policy "systemmap storage update" on storage.objects
for update to authenticated
using (
  bucket_id = 'systemmap'
  and name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/'
  and public.user_can_edit_map(((storage.foldername(name))[1])::uuid, auth.uid())
)
with check (
  bucket_id = 'systemmap'
  and name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/'
  and public.user_can_edit_map(((storage.foldername(name))[1])::uuid, auth.uid())
);

drop policy if exists "systemmap storage delete" on storage.objects;
create policy "systemmap storage delete" on storage.objects
for delete to authenticated
using (
  bucket_id = 'systemmap'
  and name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/'
  and public.user_can_edit_map(((storage.foldername(name))[1])::uuid, auth.uid())
);

update public.access_periods
set
  access_status = 'active',
  ends_at = 'infinity'::timestamptz,
  map_limit = 1,
  export_allowed = false,
  write_allowed = true,
  share_allowed = false,
  duplicate_allowed = false,
  notes = 'Free account'
where access_type = 'trial_7d';

update ms.system_maps sm
set
  owner_access_mode = 'full_access',
  owner_access_expires_at = 'infinity'::timestamptz,
  owner_read_only_reason = null
from public.access_periods ap
where sm.created_via_access_period_id = ap.id
  and ap.access_type = 'trial_7d';

update public.map_access_assignments maa
set
  access_mode = 'full_access',
  export_allowed = false,
  share_allowed = false,
  duplicate_allowed = false,
  writable_until = 'infinity'::timestamptz
from public.access_periods ap
where maa.access_period_id = ap.id
  and ap.access_type = 'trial_7d';

do $$
declare
  v_user_id uuid;
begin
  for v_user_id in
    select distinct user_id
    from public.access_periods
    where access_type = 'trial_7d'
  loop
    perform public.refresh_billing_profile_state(v_user_id);
  end loop;
end;
$$;
