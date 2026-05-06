-- Treat active organisation members as org-managed users for map creation.
-- Individual subscription/pass checks still apply to non-org users.

create or replace function public.user_has_active_org_access(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organisation_memberships membership
    join public.organisations org
      on org.id = membership.organisation_id
     and org.status = 'active'
    where membership.user_id = p_user_id
      and membership.invite_status = 'active'
  );
$$;

revoke all on function public.user_has_active_org_access(uuid) from public;
grant execute on function public.user_has_active_org_access(uuid) to authenticated;

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
    raise exception 'Map creation is not allowed for this access type';
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
    case when v_is_platform_admin or v_has_org_managed_access then null else v_period.id end,
    'full_access',
    case when v_is_platform_admin or v_has_org_managed_access then null else v_period.ends_at end
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

revoke all on function public.create_investigation_map(text) from public;
grant execute on function public.create_investigation_map(text) to authenticated;

create or replace function public.create_investigation_map_from_template(
  p_template_id uuid,
  p_title text default null,
  p_description text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, ms
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.billing_profiles;
  v_template public.investigation_templates;
  v_snapshot jsonb;
  v_new_map_id uuid;
  v_type_id_map jsonb := '{}'::jsonb;
  v_node_id_map jsonb := '{}'::jsonb;
  v_element_id_map jsonb := '{}'::jsonb;
  v_outline_heading_id_map jsonb := '{}'::jsonb;
  v_item jsonb;
  v_source_id text;
  v_inserted_id uuid;
  v_has_org_managed_access boolean := false;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  v_profile := public.refresh_billing_profile_state(v_user_id);
  v_has_org_managed_access := public.user_has_active_org_access(v_user_id);

  if not coalesce(v_profile.can_create_maps, false) and not v_has_org_managed_access then
    raise exception 'You do not have access to create investigation maps';
  end if;

  select *
  into v_template
  from public.investigation_templates
  where id = p_template_id
    and (is_global or user_id = v_user_id);

  if v_template.id is null then
    raise exception 'Template not found';
  end if;

  v_snapshot := v_template.snapshot;

  select public.create_investigation_map(p_title)
  into v_new_map_id;

  if v_new_map_id is null then
    raise exception 'Unable to create investigation map from template';
  end if;

  if nullif(btrim(coalesce(p_description, '')), '') is not null then
    update ms.system_maps
    set description = btrim(p_description)
    where id = v_new_map_id;
  end if;

  delete from ms.document_types where map_id = v_new_map_id;

  for v_item in select * from jsonb_array_elements(coalesce(v_snapshot->'types', '[]'::jsonb)) loop
    v_source_id := v_item->>'id';
    v_inserted_id := gen_random_uuid();
    v_type_id_map := jsonb_set(v_type_id_map, array[v_source_id], to_jsonb(v_inserted_id::text), true);

    insert into ms.document_types (
      id,
      map_id,
      name,
      level_rank,
      band_y_min,
      band_y_max,
      is_active
    )
    values (
      v_inserted_id,
      v_new_map_id,
      coalesce(nullif(v_item->>'name', ''), 'Untitled'),
      coalesce((v_item->>'level_rank')::integer, 1),
      nullif(v_item->>'band_y_min', '')::numeric,
      nullif(v_item->>'band_y_max', '')::numeric,
      coalesce((v_item->>'is_active')::boolean, true)
    );
  end loop;

  for v_item in select * from jsonb_array_elements(coalesce(v_snapshot->'nodes', '[]'::jsonb)) loop
    v_source_id := v_item->>'id';
    v_inserted_id := gen_random_uuid();
    v_node_id_map := jsonb_set(v_node_id_map, array[v_source_id], to_jsonb(v_inserted_id::text), true);

    insert into ms.document_nodes (
      id,
      map_id,
      type_id,
      title,
      document_number,
      discipline,
      owner_user_id,
      owner_name,
      user_group,
      pos_x,
      pos_y,
      width,
      height,
      is_archived
    )
    values (
      v_inserted_id,
      v_new_map_id,
      (v_type_id_map->>(v_item->>'type_id'))::uuid,
      coalesce(nullif(v_item->>'title', ''), 'Untitled Document'),
      nullif(v_item->>'document_number', ''),
      nullif(v_item->>'discipline', ''),
      nullif(v_item->>'owner_user_id', '')::uuid,
      nullif(v_item->>'owner_name', ''),
      nullif(v_item->>'user_group', ''),
      coalesce((v_item->>'pos_x')::numeric, 0),
      coalesce((v_item->>'pos_y')::numeric, 0),
      nullif(v_item->>'width', '')::numeric,
      nullif(v_item->>'height', '')::numeric,
      coalesce((v_item->>'is_archived')::boolean, false)
    );
  end loop;

  for v_item in select * from jsonb_array_elements(coalesce(v_snapshot->'elements', '[]'::jsonb)) loop
    v_source_id := v_item->>'id';
    v_inserted_id := gen_random_uuid();
    v_element_id_map := jsonb_set(v_element_id_map, array[v_source_id], to_jsonb(v_inserted_id::text), true);

    insert into ms.canvas_elements (
      id,
      map_id,
      element_type,
      heading,
      color_hex,
      created_by_user_id,
      element_config,
      pos_x,
      pos_y,
      width,
      height
    )
    values (
      v_inserted_id,
      v_new_map_id,
      coalesce(nullif(v_item->>'element_type', ''), 'text_box'),
      coalesce(v_item->>'heading', ''),
      nullif(v_item->>'color_hex', ''),
      nullif(v_item->>'created_by_user_id', '')::uuid,
      v_item->'element_config',
      coalesce((v_item->>'pos_x')::numeric, 0),
      coalesce((v_item->>'pos_y')::numeric, 0),
      coalesce((v_item->>'width')::numeric, 168),
      coalesce((v_item->>'height')::numeric, 96)
    );
  end loop;

  for v_item in select * from jsonb_array_elements(coalesce(v_snapshot->'relations', '[]'::jsonb)) loop
    insert into ms.node_relations (
      map_id,
      from_node_id,
      source_system_element_id,
      to_node_id,
      source_grouping_element_id,
      target_grouping_element_id,
      relation_type,
      relationship_description,
      target_system_element_id,
      relationship_disciplines,
      relationship_category,
      relationship_custom_type
    )
    values (
      v_new_map_id,
      nullif(v_node_id_map->>(v_item->>'from_node_id'), '')::uuid,
      nullif(v_element_id_map->>(v_item->>'source_system_element_id'), '')::uuid,
      nullif(v_node_id_map->>(v_item->>'to_node_id'), '')::uuid,
      nullif(v_element_id_map->>(v_item->>'source_grouping_element_id'), '')::uuid,
      nullif(v_element_id_map->>(v_item->>'target_grouping_element_id'), '')::uuid,
      coalesce(nullif(v_item->>'relation_type', ''), 'related'),
      nullif(v_item->>'relationship_description', ''),
      nullif(v_element_id_map->>(v_item->>'target_system_element_id'), '')::uuid,
      case
        when jsonb_typeof(v_item->'relationship_disciplines') = 'array'
          then array(select jsonb_array_elements_text(v_item->'relationship_disciplines'))
        else null
      end,
      nullif(v_item->>'relationship_category', ''),
      nullif(v_item->>'relationship_custom_type', '')
    );
  end loop;

  for v_item in select * from jsonb_array_elements(coalesce(v_snapshot->'outlineItems', '[]'::jsonb)) loop
    if coalesce(v_item->>'kind', '') = 'heading' then
      v_source_id := v_item->>'id';
      v_inserted_id := gen_random_uuid();
      v_outline_heading_id_map := jsonb_set(v_outline_heading_id_map, array[v_source_id], to_jsonb(v_inserted_id::text), true);

      insert into ms.document_outline_items (
        id,
        map_id,
        node_id,
        kind,
        heading_level,
        parent_heading_id,
        title,
        sort_order
      )
      values (
        v_inserted_id,
        v_new_map_id,
        (v_node_id_map->>(v_item->>'node_id'))::uuid,
        'heading',
        nullif(v_item->>'heading_level', '')::integer,
        nullif(v_outline_heading_id_map->>(v_item->>'parent_heading_id'), '')::uuid,
        nullif(v_item->>'title', ''),
        coalesce((v_item->>'sort_order')::integer, 10)
      );
    end if;
  end loop;

  for v_item in select * from jsonb_array_elements(coalesce(v_snapshot->'outlineItems', '[]'::jsonb)) loop
    if coalesce(v_item->>'kind', '') <> 'heading' then
      insert into ms.document_outline_items (
        map_id,
        node_id,
        kind,
        heading_id,
        title,
        content_text,
        sort_order
      )
      values (
        v_new_map_id,
        (v_node_id_map->>(v_item->>'node_id'))::uuid,
        'content',
        nullif(v_outline_heading_id_map->>(v_item->>'heading_id'), '')::uuid,
        nullif(v_item->>'title', ''),
        nullif(v_item->>'content_text', ''),
        coalesce((v_item->>'sort_order')::integer, 10)
      );
    end if;
  end loop;

  return v_new_map_id;
end;
$$;

revoke all on function public.create_investigation_map_from_template(uuid, text, text) from public;
grant execute on function public.create_investigation_map_from_template(uuid, text, text) to authenticated;
