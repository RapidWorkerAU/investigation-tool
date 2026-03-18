-- Subscription-only investigation templates.

create table if not exists public.investigation_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  name_normalized text generated always as (lower(btrim(name))) stored,
  map_category text not null default 'incident_investigation' check (map_category = 'incident_investigation'),
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint investigation_templates_name_check check (char_length(btrim(name)) between 1 and 120)
);

create unique index if not exists idx_investigation_templates_user_name
on public.investigation_templates (user_id, name_normalized);

drop trigger if exists trg_investigation_templates_updated_at on public.investigation_templates;
create trigger trg_investigation_templates_updated_at
before update on public.investigation_templates
for each row
execute function public.touch_updated_at_public();

alter table public.investigation_templates enable row level security;

drop policy if exists investigation_templates_self_read on public.investigation_templates;
create policy investigation_templates_self_read on public.investigation_templates
for select to authenticated
using (user_id = auth.uid());

grant select on public.investigation_templates to authenticated;

create or replace function public.has_active_monthly_subscription(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.access_periods ap
    where ap.user_id = p_user_id
      and ap.access_type = 'subscription_monthly'
      and ap.access_status = 'active'
      and now() >= ap.starts_at
      and now() < ap.ends_at
  );
$$;

revoke all on function public.has_active_monthly_subscription(uuid) from public;
grant execute on function public.has_active_monthly_subscription(uuid) to authenticated;

create or replace function public.list_investigation_templates(
  p_query text default null,
  p_limit integer default 20
)
returns table (
  id uuid,
  name text,
  updated_at timestamptz
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

  if not public.has_active_monthly_subscription(v_user_id) then
    raise exception 'Templates are only available for active subscription holders';
  end if;

  return query
  select t.id, t.name, t.updated_at
  from public.investigation_templates t
  where t.user_id = v_user_id
    and (v_query is null or t.name ilike '%' || v_query || '%')
  order by t.updated_at desc, t.created_at desc
  limit v_limit;
end;
$$;

revoke all on function public.list_investigation_templates(text, integer) from public;
grant execute on function public.list_investigation_templates(text, integer) to authenticated;

create or replace function public.save_investigation_template(
  p_name text,
  p_snapshot jsonb,
  p_template_id uuid default null
)
returns table (
  id uuid,
  name text,
  updated_at timestamptz,
  was_overwritten boolean
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
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.has_active_monthly_subscription(v_user_id) then
    raise exception 'Templates are only available for active subscription holders';
  end if;

  if v_name = '' then
    raise exception 'Template name is required';
  end if;

  if p_snapshot is null or jsonb_typeof(p_snapshot) <> 'object' then
    raise exception 'Template snapshot is invalid';
  end if;

  if p_template_id is not null then
    select *
    into v_template
    from public.investigation_templates
    where id = p_template_id
      and user_id = v_user_id;

    if v_template.id is null then
      raise exception 'Template not found';
    end if;
  else
    select *
    into v_template
    from public.investigation_templates
    where user_id = v_user_id
      and name_normalized = lower(v_name);
  end if;

  if v_template.id is null then
    insert into public.investigation_templates (
      user_id,
      name,
      map_category,
      snapshot
    )
    values (
      v_user_id,
      v_name,
      'incident_investigation',
      p_snapshot
    )
    returning * into v_template;
  else
    update public.investigation_templates
    set
      name = v_name,
      snapshot = p_snapshot
    where id = v_template.id
    returning * into v_template;

    v_overwritten := true;
  end if;

  return query
  select v_template.id, v_template.name, v_template.updated_at, v_overwritten;
end;
$$;

revoke all on function public.save_investigation_template(text, jsonb, uuid) from public;
grant execute on function public.save_investigation_template(text, jsonb, uuid) to authenticated;

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
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.has_active_monthly_subscription(v_user_id) then
    raise exception 'Templates are only available for active subscription holders';
  end if;

  select *
  into v_template
  from public.investigation_templates
  where id = p_template_id
    and user_id = v_user_id;

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

  for v_item in
    select value
    from jsonb_array_elements(coalesce(v_snapshot->'types', '[]'::jsonb))
  loop
    insert into ms.document_types (
      map_id,
      name,
      level_rank,
      band_y_min,
      band_y_max,
      is_active
    )
    values (
      v_new_map_id,
      coalesce(nullif(v_item->>'name', ''), 'Untitled'),
      coalesce((v_item->>'level_rank')::integer, 1),
      nullif(v_item->>'band_y_min', '')::numeric,
      nullif(v_item->>'band_y_max', '')::numeric,
      coalesce((v_item->>'is_active')::boolean, true)
    )
    returning id into v_inserted_id;

    v_source_id := coalesce(nullif(v_item->>'id', ''), gen_random_uuid()::text);
    v_type_id_map := v_type_id_map || jsonb_build_object(v_source_id, v_inserted_id::text);
  end loop;

  for v_item in
    select value
    from jsonb_array_elements(coalesce(v_snapshot->'nodes', '[]'::jsonb))
  loop
    insert into ms.document_nodes (
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
      v_new_map_id,
      coalesce(nullif(v_type_id_map ->> coalesce(v_item->>'type_id', ''), ''), v_item->>'type_id')::uuid,
      coalesce(nullif(v_item->>'title', ''), 'Untitled Document'),
      nullif(v_item->>'document_number', ''),
      nullif(v_item->>'discipline', ''),
      case
        when v_item->>'owner_user_id' = v_user_id::text then v_user_id
        else null
      end,
      nullif(v_item->>'owner_name', ''),
      nullif(v_item->>'user_group', ''),
      coalesce((v_item->>'pos_x')::numeric, 0),
      coalesce((v_item->>'pos_y')::numeric, 0),
      nullif(v_item->>'width', '')::numeric,
      nullif(v_item->>'height', '')::numeric,
      coalesce((v_item->>'is_archived')::boolean, false)
    )
    returning id into v_inserted_id;

    v_source_id := coalesce(nullif(v_item->>'id', ''), gen_random_uuid()::text);
    v_node_id_map := v_node_id_map || jsonb_build_object(v_source_id, v_inserted_id::text);
  end loop;

  for v_item in
    select value
    from jsonb_array_elements(coalesce(v_snapshot->'elements', '[]'::jsonb))
  loop
    insert into ms.canvas_elements (
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
      v_new_map_id,
      coalesce(nullif(v_item->>'element_type', ''), 'text_box'),
      coalesce(v_item->>'heading', ''),
      nullif(v_item->>'color_hex', ''),
      v_user_id,
      v_item->'element_config',
      coalesce((v_item->>'pos_x')::numeric, 0),
      coalesce((v_item->>'pos_y')::numeric, 0),
      coalesce((v_item->>'width')::numeric, 168),
      coalesce((v_item->>'height')::numeric, 96)
    )
    returning id into v_inserted_id;

    v_source_id := coalesce(nullif(v_item->>'id', ''), gen_random_uuid()::text);
    v_element_id_map := v_element_id_map || jsonb_build_object(v_source_id, v_inserted_id::text);
  end loop;

  for v_item in
    select value
    from jsonb_array_elements(coalesce(v_snapshot->'relations', '[]'::jsonb))
  loop
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
      nullif(v_node_id_map ->> coalesce(v_item->>'from_node_id', ''), '')::uuid,
      nullif(v_element_id_map ->> coalesce(v_item->>'source_system_element_id', ''), '')::uuid,
      nullif(v_node_id_map ->> coalesce(v_item->>'to_node_id', ''), '')::uuid,
      nullif(v_element_id_map ->> coalesce(v_item->>'source_grouping_element_id', ''), '')::uuid,
      nullif(v_element_id_map ->> coalesce(v_item->>'target_grouping_element_id', ''), '')::uuid,
      coalesce(nullif(v_item->>'relation_type', ''), 'related'),
      nullif(v_item->>'relationship_description', ''),
      nullif(v_element_id_map ->> coalesce(v_item->>'target_system_element_id', ''), '')::uuid,
      case
        when jsonb_typeof(v_item->'relationship_disciplines') = 'array'
          then array(select jsonb_array_elements_text(v_item->'relationship_disciplines'))
        else null
      end,
      nullif(v_item->>'relationship_category', ''),
      nullif(v_item->>'relationship_custom_type', '')
    );
  end loop;

  for v_item in
    select value
    from jsonb_array_elements(coalesce(v_snapshot->'outlineItems', '[]'::jsonb))
    where value->>'kind' = 'heading'
  loop
    insert into ms.document_outline_items (
      map_id,
      node_id,
      kind,
      heading_level,
      parent_heading_id,
      heading_id,
      title,
      content_text,
      sort_order
    )
    values (
      v_new_map_id,
      coalesce(nullif(v_node_id_map ->> coalesce(v_item->>'node_id', ''), ''), v_item->>'node_id')::uuid,
      'heading',
      nullif(v_item->>'heading_level', '')::integer,
      nullif(v_outline_heading_id_map ->> coalesce(v_item->>'parent_heading_id', ''), '')::uuid,
      null,
      nullif(v_item->>'title', ''),
      nullif(v_item->>'content_text', ''),
      coalesce((v_item->>'sort_order')::integer, 10)
    )
    returning id into v_inserted_id;

    v_source_id := coalesce(nullif(v_item->>'id', ''), gen_random_uuid()::text);
    v_outline_heading_id_map := v_outline_heading_id_map || jsonb_build_object(v_source_id, v_inserted_id::text);
  end loop;

  for v_item in
    select value
    from jsonb_array_elements(coalesce(v_snapshot->'outlineItems', '[]'::jsonb))
    where value->>'kind' = 'content'
  loop
    insert into ms.document_outline_items (
      map_id,
      node_id,
      kind,
      heading_level,
      parent_heading_id,
      heading_id,
      title,
      content_text,
      sort_order
    )
    values (
      v_new_map_id,
      coalesce(nullif(v_node_id_map ->> coalesce(v_item->>'node_id', ''), ''), v_item->>'node_id')::uuid,
      'content',
      nullif(v_item->>'heading_level', '')::integer,
      nullif(v_outline_heading_id_map ->> coalesce(v_item->>'parent_heading_id', ''), '')::uuid,
      nullif(v_outline_heading_id_map ->> coalesce(v_item->>'heading_id', ''), '')::uuid,
      nullif(v_item->>'title', ''),
      nullif(v_item->>'content_text', ''),
      coalesce((v_item->>'sort_order')::integer, 10)
    );
  end loop;

  return v_new_map_id;
end;
$$;

revoke all on function public.create_investigation_map_from_template(uuid, text, text) from public;
grant execute on function public.create_investigation_map_from_template(uuid, text, text) to authenticated;
