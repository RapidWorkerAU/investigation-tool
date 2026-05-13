alter table ms.canvas_elements
  drop constraint if exists canvas_elements_element_type_check;

alter table ms.canvas_elements
  add constraint canvas_elements_element_type_check check (
    element_type = any (
      array[
        'category'::text,
        'system_circle'::text,
        'grouping_container'::text,
        'process_component'::text,
        'equipment'::text,
        'environment'::text,
        'anchor'::text,
        'sticky_note'::text,
        'person'::text,
        'image_asset'::text,
        'text_box'::text,
        'table'::text,
        'shape_rectangle'::text,
        'shape_circle'::text,
        'shape_pill'::text,
        'shape_pentagon'::text,
        'shape_chevron_left'::text,
        'shape_arrow'::text,
        'bowtie_hazard'::text,
        'bowtie_top_event'::text,
        'bowtie_threat'::text,
        'bowtie_consequence'::text,
        'bowtie_control'::text,
        'bowtie_escalation_factor'::text,
        'bowtie_recovery_measure'::text,
        'bowtie_degradation_indicator'::text,
        'bowtie_risk_rating'::text,
        'incident_sequence_step'::text,
        'incident_outcome'::text,
        'incident_task_condition'::text,
        'incident_factor'::text,
        'incident_system_factor'::text,
        'incident_control_barrier'::text,
        'incident_evidence'::text,
        'incident_response_recovery'::text,
        'incident_finding'::text,
        'incident_recommendation'::text
      ]
    )
  );

create table if not exists ms.canvas_anchor_links (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references ms.system_maps(id) on delete cascade,
  anchor_id uuid not null references ms.canvas_elements(id) on delete cascade,
  linked_anchor_id uuid not null references ms.canvas_elements(id) on delete cascade,
  sort_order integer not null default 0,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint canvas_anchor_links_distinct_check check (anchor_id <> linked_anchor_id),
  constraint canvas_anchor_links_unique unique (map_id, anchor_id, linked_anchor_id)
);

create index if not exists idx_canvas_anchor_links_map on ms.canvas_anchor_links(map_id);
create index if not exists idx_canvas_anchor_links_anchor on ms.canvas_anchor_links(anchor_id, sort_order);
create index if not exists idx_canvas_anchor_links_linked_anchor on ms.canvas_anchor_links(linked_anchor_id);

create or replace function ms.validate_canvas_anchor_link()
returns trigger
language plpgsql
as $$
declare
  source_map_id uuid;
  source_element_type text;
  target_map_id uuid;
  target_element_type text;
begin
  select map_id, element_type
  into source_map_id, source_element_type
  from ms.canvas_elements
  where id = new.anchor_id;

  select map_id, element_type
  into target_map_id, target_element_type
  from ms.canvas_elements
  where id = new.linked_anchor_id;

  if source_map_id is null or target_map_id is null then
    raise exception 'Anchor link endpoints must exist';
  end if;

  if source_map_id <> new.map_id or target_map_id <> new.map_id then
    raise exception 'Anchor link endpoints must belong to the same map';
  end if;

  if source_element_type <> 'anchor' or target_element_type <> 'anchor' then
    raise exception 'Anchor links can only connect anchor nodes';
  end if;

  if new.sort_order < 0 then
    new.sort_order := 0;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_canvas_anchor_links_validate on ms.canvas_anchor_links;
create trigger trg_canvas_anchor_links_validate
before insert or update on ms.canvas_anchor_links
for each row
execute function ms.validate_canvas_anchor_link();

drop trigger if exists trg_canvas_anchor_links_updated_at on ms.canvas_anchor_links;
create trigger trg_canvas_anchor_links_updated_at
before update on ms.canvas_anchor_links
for each row
execute function ms.touch_updated_at();

drop trigger if exists trg_canvas_anchor_links_bump_system_map on ms.canvas_anchor_links;
create trigger trg_canvas_anchor_links_bump_system_map
after insert or update or delete on ms.canvas_anchor_links
for each row
execute function ms.bump_parent_system_map();

alter table ms.canvas_anchor_links enable row level security;

drop policy if exists canvas_anchor_links_read on ms.canvas_anchor_links;
create policy canvas_anchor_links_read on ms.canvas_anchor_links
for select to authenticated
using (
  exists (
    select 1
    from ms.system_maps sm
    where sm.id = canvas_anchor_links.map_id
      and (sm.owner_id = auth.uid() or ms.user_is_map_member(canvas_anchor_links.map_id))
  )
);

drop policy if exists canvas_anchor_links_write on ms.canvas_anchor_links;
create policy canvas_anchor_links_write on ms.canvas_anchor_links
for all to authenticated
using (
  exists (
    select 1
    from ms.system_maps sm
    left join ms.map_members mm on mm.map_id = sm.id and mm.user_id = auth.uid()
    where sm.id = canvas_anchor_links.map_id
      and (sm.owner_id = auth.uid() or mm.role in ('partial_write', 'full_write'))
  )
)
with check (
  exists (
    select 1
    from ms.system_maps sm
    left join ms.map_members mm on mm.map_id = sm.id and mm.user_id = auth.uid()
    where sm.id = canvas_anchor_links.map_id
      and (sm.owner_id = auth.uid() or mm.role in ('partial_write', 'full_write'))
  )
);

grant select, insert, update, delete on ms.canvas_anchor_links to authenticated;

create or replace function public.restore_system_map_session_snapshot(
  p_map_id uuid,
  p_snapshot jsonb
)
returns void
language plpgsql
security definer
set search_path = public, ms
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_map_id is null then
    raise exception 'Map id is required';
  end if;

  if p_snapshot is null or jsonb_typeof(p_snapshot) <> 'object' then
    raise exception 'Snapshot is invalid';
  end if;

  if not exists (
    select 1
    from ms.system_maps sm
    left join ms.map_members mm on mm.map_id = sm.id and mm.user_id = v_user_id
    where sm.id = p_map_id
      and (sm.owner_id = v_user_id or mm.role in ('partial_write', 'full_write'))
  ) then
    raise exception 'Map not found or not editable';
  end if;

  update ms.system_maps
  set
    title = coalesce(nullif(btrim(p_snapshot->'map'->>'title'), ''), title),
    description = nullif(btrim(coalesce(p_snapshot->'map'->>'description', '')), ''),
    map_code = nullif(btrim(coalesce(p_snapshot->'map'->>'map_code', '')), ''),
    map_category = coalesce(nullif(btrim(coalesce(p_snapshot->'map'->>'map_category', '')), ''), map_category),
    updated_by_user_id = v_user_id
  where id = p_map_id;

  delete from ms.document_outline_items where map_id = p_map_id;
  delete from ms.node_relations where map_id = p_map_id;
  delete from ms.canvas_anchor_links where map_id = p_map_id;
  delete from ms.canvas_elements where map_id = p_map_id;
  delete from ms.document_nodes where map_id = p_map_id;
  delete from ms.document_types where map_id = p_map_id;

  insert into ms.document_types (
    id,
    map_id,
    name,
    level_rank,
    band_y_min,
    band_y_max,
    is_active
  )
  select
    coalesce(nullif(value->>'id', '')::uuid, gen_random_uuid()),
    p_map_id,
    coalesce(nullif(value->>'name', ''), 'Untitled'),
    coalesce((value->>'level_rank')::integer, 1),
    nullif(value->>'band_y_min', '')::numeric,
    nullif(value->>'band_y_max', '')::numeric,
    coalesce((value->>'is_active')::boolean, true)
  from jsonb_array_elements(coalesce(p_snapshot->'types', '[]'::jsonb))
  where nullif(value->>'map_id', '')::uuid = p_map_id;

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
  select
    coalesce(nullif(value->>'id', '')::uuid, gen_random_uuid()),
    p_map_id,
    (value->>'type_id')::uuid,
    coalesce(nullif(value->>'title', ''), 'Untitled Document'),
    nullif(value->>'document_number', ''),
    nullif(value->>'discipline', ''),
    nullif(value->>'owner_user_id', '')::uuid,
    nullif(value->>'owner_name', ''),
    nullif(value->>'user_group', ''),
    coalesce((value->>'pos_x')::numeric, 0),
    coalesce((value->>'pos_y')::numeric, 0),
    nullif(value->>'width', '')::numeric,
    nullif(value->>'height', '')::numeric,
    coalesce((value->>'is_archived')::boolean, false)
  from jsonb_array_elements(coalesce(p_snapshot->'nodes', '[]'::jsonb));

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
  select
    coalesce(nullif(value->>'id', '')::uuid, gen_random_uuid()),
    p_map_id,
    coalesce(nullif(value->>'element_type', ''), 'text_box'),
    coalesce(value->>'heading', ''),
    nullif(value->>'color_hex', ''),
    nullif(value->>'created_by_user_id', '')::uuid,
    value->'element_config',
    coalesce((value->>'pos_x')::numeric, 0),
    coalesce((value->>'pos_y')::numeric, 0),
    coalesce((value->>'width')::numeric, 168),
    coalesce((value->>'height')::numeric, 96)
  from jsonb_array_elements(coalesce(p_snapshot->'elements', '[]'::jsonb));

  insert into ms.canvas_anchor_links (
    id,
    map_id,
    anchor_id,
    linked_anchor_id,
    sort_order,
    created_by_user_id
  )
  select
    coalesce(nullif(value->>'id', '')::uuid, gen_random_uuid()),
    p_map_id,
    nullif(value->>'anchor_id', '')::uuid,
    nullif(value->>'linked_anchor_id', '')::uuid,
    coalesce((value->>'sort_order')::integer, 0),
    nullif(value->>'created_by_user_id', '')::uuid
  from jsonb_array_elements(coalesce(p_snapshot->'anchorLinks', '[]'::jsonb))
  where nullif(value->>'anchor_id', '') is not null
    and nullif(value->>'linked_anchor_id', '') is not null;

  insert into ms.node_relations (
    id,
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
  select
    coalesce(nullif(value->>'id', '')::uuid, gen_random_uuid()),
    p_map_id,
    nullif(value->>'from_node_id', '')::uuid,
    nullif(value->>'source_system_element_id', '')::uuid,
    nullif(value->>'to_node_id', '')::uuid,
    nullif(value->>'source_grouping_element_id', '')::uuid,
    nullif(value->>'target_grouping_element_id', '')::uuid,
    coalesce(nullif(value->>'relation_type', ''), 'related'),
    nullif(value->>'relationship_description', ''),
    nullif(value->>'target_system_element_id', '')::uuid,
    case
      when jsonb_typeof(value->'relationship_disciplines') = 'array'
        then array(select jsonb_array_elements_text(value->'relationship_disciplines'))
      else null
    end,
    nullif(value->>'relationship_category', ''),
    nullif(value->>'relationship_custom_type', '')
  from jsonb_array_elements(coalesce(p_snapshot->'relations', '[]'::jsonb));

  insert into ms.document_outline_items (
    id,
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
  select
    coalesce(nullif(value->>'id', '')::uuid, gen_random_uuid()),
    p_map_id,
    (value->>'node_id')::uuid,
    coalesce(nullif(value->>'kind', ''), 'content'),
    nullif(value->>'heading_level', '')::integer,
    nullif(value->>'parent_heading_id', '')::uuid,
    nullif(value->>'heading_id', '')::uuid,
    nullif(value->>'title', ''),
    nullif(value->>'content_text', ''),
    coalesce((value->>'sort_order')::integer, 10)
  from jsonb_array_elements(coalesce(p_snapshot->'outlineItems', '[]'::jsonb));
end;
$$;

revoke all on function public.restore_system_map_session_snapshot(uuid, jsonb) from public;
grant execute on function public.restore_system_map_session_snapshot(uuid, jsonb) to authenticated;

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

  for v_item in select * from jsonb_array_elements(coalesce(v_snapshot->'anchorLinks', '[]'::jsonb)) loop
    if v_element_id_map ? (v_item->>'anchor_id') and v_element_id_map ? (v_item->>'linked_anchor_id') then
      insert into ms.canvas_anchor_links (
        map_id,
        anchor_id,
        linked_anchor_id,
        sort_order,
        created_by_user_id
      )
      values (
        v_new_map_id,
        (v_element_id_map->>(v_item->>'anchor_id'))::uuid,
        (v_element_id_map->>(v_item->>'linked_anchor_id'))::uuid,
        coalesce((v_item->>'sort_order')::integer, 0),
        v_user_id
      )
      on conflict (map_id, anchor_id, linked_anchor_id) do update
      set sort_order = excluded.sort_order;
    end if;
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
