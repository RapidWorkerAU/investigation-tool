create table if not exists ms.map_session_history (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references ms.system_maps(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id text not null,
  position integer not null check (position >= 0),
  snapshot jsonb not null,
  snapshot_hash text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_map_session_history_unique_position
on ms.map_session_history (map_id, user_id, session_id, position);

create index if not exists idx_map_session_history_lookup
on ms.map_session_history (map_id, user_id, session_id, created_at asc);

grant select, insert, update, delete on ms.map_session_history to authenticated;

alter table ms.map_session_history enable row level security;

drop policy if exists map_session_history_read on ms.map_session_history;
create policy map_session_history_read on ms.map_session_history
for select to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1 from ms.system_maps sm
    where sm.id = map_session_history.map_id
      and (
        sm.owner_id = auth.uid()
        or exists (
          select 1 from ms.map_members mm
          where mm.map_id = map_session_history.map_id and mm.user_id = auth.uid()
        )
      )
  )
);

drop policy if exists map_session_history_write on ms.map_session_history;
create policy map_session_history_write on ms.map_session_history
for all to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from ms.system_maps sm
    left join ms.map_members mm on mm.map_id = sm.id and mm.user_id = auth.uid()
    where sm.id = map_session_history.map_id
      and (sm.owner_id = auth.uid() or mm.role in ('partial_write', 'full_write'))
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from ms.system_maps sm
    left join ms.map_members mm on mm.map_id = sm.id and mm.user_id = auth.uid()
    where sm.id = map_session_history.map_id
      and (sm.owner_id = auth.uid() or mm.role in ('partial_write', 'full_write'))
  )
);

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
  from jsonb_array_elements(coalesce(p_snapshot->'types', '[]'::jsonb));

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
