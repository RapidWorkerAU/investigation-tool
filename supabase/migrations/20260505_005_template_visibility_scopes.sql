-- Add explicit template visibility scopes:
-- private: visible only to the creator
-- organisation: visible to active members of the creator's active organisation
-- global: visible to every authenticated Investigation Tool user

alter table public.investigation_templates
add column if not exists visibility text;

alter table public.investigation_templates
add column if not exists organisation_id uuid references public.organisations(id) on delete set null;

update public.investigation_templates
set visibility = case when is_global then 'global' else 'private' end
where visibility is null;

alter table public.investigation_templates
alter column visibility set default 'private';

alter table public.investigation_templates
alter column visibility set not null;

alter table public.investigation_templates
drop constraint if exists investigation_templates_visibility_check;

alter table public.investigation_templates
add constraint investigation_templates_visibility_check
check (visibility in ('private', 'organisation', 'global'));

alter table public.investigation_templates
drop constraint if exists investigation_templates_visibility_org_check;

alter table public.investigation_templates
add constraint investigation_templates_visibility_org_check
check (
  (visibility = 'organisation' and organisation_id is not null and is_global = false)
  or (visibility = 'global' and organisation_id is null and is_global = true)
  or (visibility = 'private' and organisation_id is null and is_global = false)
);

drop index if exists public.idx_investigation_templates_user_name;
drop index if exists public.idx_investigation_templates_global_name;
drop index if exists public.idx_investigation_templates_org_name;

create unique index if not exists idx_investigation_templates_private_user_name
on public.investigation_templates (user_id, name_normalized)
where visibility = 'private';

create unique index if not exists idx_investigation_templates_org_name
on public.investigation_templates (organisation_id, name_normalized)
where visibility = 'organisation';

create unique index if not exists idx_investigation_templates_global_name
on public.investigation_templates (name_normalized)
where visibility = 'global';

create index if not exists idx_investigation_templates_visibility_org
on public.investigation_templates (visibility, organisation_id);

create or replace function public.user_active_organisation_id(p_user_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select membership.organisation_id
  from public.organisation_memberships membership
  join public.organisations org
    on org.id = membership.organisation_id
   and org.status = 'active'
  where membership.user_id = p_user_id
    and membership.invite_status = 'active'
  order by membership.joined_at nulls last, membership.created_at
  limit 1;
$$;

revoke all on function public.user_active_organisation_id(uuid) from public;
grant execute on function public.user_active_organisation_id(uuid) to authenticated;

create or replace function public.user_is_active_org_admin(p_user_id uuid, p_organisation_id uuid)
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
      and membership.organisation_id = p_organisation_id
      and membership.invite_status = 'active'
      and membership.role = 'org_admin'
  );
$$;

revoke all on function public.user_is_active_org_admin(uuid, uuid) from public;
grant execute on function public.user_is_active_org_admin(uuid, uuid) to authenticated;

create or replace function public.user_can_read_investigation_template(p_template public.investigation_templates, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    p_user_id is not null
    and (
      p_template.visibility = 'global'
      or (p_template.visibility = 'private' and p_template.user_id = p_user_id)
      or (
        p_template.visibility = 'organisation'
        and exists (
          select 1
          from public.organisation_memberships membership
          join public.organisations org
            on org.id = membership.organisation_id
           and org.status = 'active'
          where membership.user_id = p_user_id
            and membership.organisation_id = p_template.organisation_id
            and membership.invite_status = 'active'
        )
      )
    );
$$;

revoke all on function public.user_can_read_investigation_template(public.investigation_templates, uuid) from public;
grant execute on function public.user_can_read_investigation_template(public.investigation_templates, uuid) to authenticated;

create or replace function public.user_can_edit_investigation_template(p_template public.investigation_templates, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    p_user_id is not null
    and (
      p_template.user_id = p_user_id
      or public.is_platform_admin(p_user_id)
      or (
        p_template.visibility = 'organisation'
        and public.user_is_active_org_admin(p_user_id, p_template.organisation_id)
      )
    );
$$;

revoke all on function public.user_can_edit_investigation_template(public.investigation_templates, uuid) from public;
grant execute on function public.user_can_edit_investigation_template(public.investigation_templates, uuid) to authenticated;

drop policy if exists investigation_templates_self_read on public.investigation_templates;
drop policy if exists investigation_templates_global_or_self_read on public.investigation_templates;
drop policy if exists investigation_templates_scoped_read on public.investigation_templates;

create policy investigation_templates_scoped_read on public.investigation_templates
for select to authenticated
using (public.user_can_read_investigation_template(investigation_templates, auth.uid()));

drop function if exists public.list_investigation_templates(text, integer);

create or replace function public.list_investigation_templates(
  p_query text default null,
  p_limit integer default 20
)
returns table (
  id uuid,
  name text,
  updated_at timestamptz,
  is_global boolean,
  can_edit boolean,
  visibility text,
  organisation_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_query text := nullif(btrim(coalesce(p_query, '')), '');
  v_limit integer := greatest(1, least(coalesce(p_limit, 20), 50));
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.has_active_monthly_subscription(v_user_id) and not public.user_has_active_org_access(v_user_id) then
    raise exception 'Templates are only available for active subscription or organisation users';
  end if;

  return query
  select
    t.id,
    t.name,
    t.updated_at,
    t.is_global,
    public.user_can_edit_investigation_template(t, v_user_id) as can_edit,
    t.visibility,
    t.organisation_id
  from public.investigation_templates t
  where public.user_can_read_investigation_template(t, v_user_id)
    and (v_query is null or t.name ilike '%' || v_query || '%')
  order by
    case t.visibility when 'global' then 0 when 'organisation' then 1 else 2 end,
    t.updated_at desc,
    t.created_at desc
  limit v_limit;
end;
$$;

revoke all on function public.list_investigation_templates(text, integer) from public;
grant execute on function public.list_investigation_templates(text, integer) to authenticated;

drop function if exists public.save_investigation_template(text, jsonb, uuid, boolean);

create or replace function public.save_investigation_template(
  p_name text,
  p_snapshot jsonb,
  p_template_id uuid default null,
  p_is_global boolean default false,
  p_visibility text default null
)
returns table (
  id uuid,
  name text,
  updated_at timestamptz,
  was_overwritten boolean,
  is_global boolean,
  visibility text,
  organisation_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_name text := btrim(coalesce(p_name, ''));
  v_template public.investigation_templates;
  v_overwritten boolean := false;
  v_visibility text := coalesce(nullif(btrim(coalesce(p_visibility, '')), ''), case when coalesce(p_is_global, false) then 'global' else 'private' end);
  v_is_global boolean;
  v_organisation_id uuid := null;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.has_active_monthly_subscription(v_user_id) and not public.user_has_active_org_access(v_user_id) then
    raise exception 'Templates are only available for active subscription or organisation users';
  end if;

  if v_visibility not in ('private', 'organisation', 'global') then
    raise exception 'Invalid template visibility';
  end if;

  if v_visibility = 'organisation' then
    v_organisation_id := public.user_active_organisation_id(v_user_id);
    if v_organisation_id is null then
      raise exception 'Organisation templates require active organisation membership';
    end if;
  end if;

  v_is_global := v_visibility = 'global';

  if v_name = '' then
    raise exception 'Template name is required';
  end if;

  if p_snapshot is null or jsonb_typeof(p_snapshot) <> 'object' then
    raise exception 'Template snapshot is invalid';
  end if;

  if p_template_id is not null then
    select *
    into v_template
    from public.investigation_templates t
    where t.id = p_template_id
      and public.user_can_edit_investigation_template(t, v_user_id);

    if v_template.id is null then
      raise exception 'Template not found';
    end if;

    if v_template.visibility <> v_visibility then
      raise exception 'Template scope changed. Re-select the template before saving.';
    end if;

    if v_visibility = 'organisation' then
      v_organisation_id := v_template.organisation_id;
    end if;
  else
    select *
    into v_template
    from public.investigation_templates t
    where t.name_normalized = lower(v_name)
      and (
        (v_visibility = 'global' and t.visibility = 'global')
        or (v_visibility = 'private' and t.visibility = 'private' and t.user_id = v_user_id)
        or (v_visibility = 'organisation' and t.visibility = 'organisation' and t.organisation_id = v_organisation_id)
      )
      and public.user_can_edit_investigation_template(t, v_user_id);
  end if;

  if v_template.id is null then
    insert into public.investigation_templates (
      user_id,
      name,
      map_category,
      snapshot,
      is_global,
      visibility,
      organisation_id
    )
    values (
      v_user_id,
      v_name,
      'incident_investigation',
      p_snapshot,
      v_is_global,
      v_visibility,
      v_organisation_id
    )
    returning * into v_template;
  else
    update public.investigation_templates t
    set
      name = v_name,
      snapshot = p_snapshot,
      is_global = v_is_global,
      visibility = v_visibility,
      organisation_id = v_organisation_id
    where t.id = v_template.id
    returning * into v_template;

    v_overwritten := true;
  end if;

  return query
  select
    v_template.id,
    v_template.name,
    v_template.updated_at,
    v_overwritten,
    v_template.is_global,
    v_template.visibility,
    v_template.organisation_id;
end;
$$;

revoke all on function public.save_investigation_template(text, jsonb, uuid, boolean, text) from public;
grant execute on function public.save_investigation_template(text, jsonb, uuid, boolean, text) to authenticated;

create or replace function public.delete_investigation_templates(
  p_template_ids uuid[]
)
returns integer
language plpgsql
security definer
set search_path = public, ms
as $$
declare
  v_user_id uuid := auth.uid();
  v_deleted_count integer := 0;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if coalesce(array_length(p_template_ids, 1), 0) = 0 then
    return 0;
  end if;

  delete from ms.system_maps sm
  where sm.is_template_editor = true
    and sm.source_template_id = any(p_template_ids)
    and exists (
      select 1
      from public.investigation_templates t
      where t.id = sm.source_template_id
        and public.user_can_edit_investigation_template(t, v_user_id)
    );

  delete from public.investigation_templates t
  where t.id = any(p_template_ids)
    and public.user_can_edit_investigation_template(t, v_user_id);

  get diagnostics v_deleted_count = row_count;
  return v_deleted_count;
end;
$$;

revoke all on function public.delete_investigation_templates(uuid[]) from public;
grant execute on function public.delete_investigation_templates(uuid[]) to authenticated;

drop function if exists public.create_template_editor_map(uuid);

create or replace function public.create_template_editor_map(
  p_template_id uuid
)
returns table (
  map_id uuid,
  template_name text,
  is_global boolean,
  visibility text,
  organisation_id uuid
)
language plpgsql
security definer
set search_path = public, ms
as $$
declare
  v_user_id uuid := auth.uid();
  v_template public.investigation_templates;
  v_map_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select *
  into v_template
  from public.investigation_templates t
  where t.id = p_template_id
    and public.user_can_edit_investigation_template(t, v_user_id);

  if v_template.id is null then
    raise exception 'Template not found or not editable';
  end if;

  delete from ms.system_maps sm
  where sm.owner_id = v_user_id
    and sm.is_template_editor = true
    and sm.source_template_id = p_template_id;

  select public.create_investigation_map_from_template(
    p_template_id,
    v_template.name,
    null
  )
  into v_map_id;

  update ms.system_maps
  set
    title = v_template.name,
    is_template_editor = true,
    source_template_id = p_template_id
  where id = v_map_id;

  return query
  select v_map_id, v_template.name, v_template.is_global, v_template.visibility, v_template.organisation_id;
end;
$$;

revoke all on function public.create_template_editor_map(uuid) from public;
grant execute on function public.create_template_editor_map(uuid) to authenticated;

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
  from public.investigation_templates t
  where t.id = p_template_id
    and public.user_can_read_investigation_template(t, v_user_id);

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
