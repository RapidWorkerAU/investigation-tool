-- Bulk canvas drag persistence avoids one network request and one parent-map
-- timestamp bump per moved node during multi-select drags.

create or replace function ms.bump_parent_system_map()
returns trigger
language plpgsql
set search_path = pg_catalog, auth, ms
as $$
declare
  target_map_id uuid;
begin
  if current_setting('ms.skip_parent_system_map_bump', true) = 'on' then
    return coalesce(new, old);
  end if;

  target_map_id := coalesce(new.map_id, old.map_id);

  if target_map_id is not null then
    update ms.system_maps
    set updated_at = now(),
        updated_by_user_id = coalesce(auth.uid(), updated_by_user_id)
    where id = target_map_id;
  end if;

  return coalesce(new, old);
end;
$$;

create or replace function public.update_system_map_item_positions(
  p_map_id uuid,
  p_document_positions jsonb default '[]'::jsonb,
  p_element_positions jsonb default '[]'::jsonb
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, ms, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_document_update_count integer := 0;
  v_element_update_count integer := 0;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_map_id is null then
    raise exception 'Map id is required';
  end if;

  if p_document_positions is null or jsonb_typeof(p_document_positions) <> 'array' then
    raise exception 'Document positions must be an array';
  end if;

  if p_element_positions is null or jsonb_typeof(p_element_positions) <> 'array' then
    raise exception 'Element positions must be an array';
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

  perform set_config('ms.skip_parent_system_map_bump', 'on', true);

  with parsed as (
    select
      nullif(value->>'id', '')::uuid as id,
      nullif(value->>'x', '')::numeric as x,
      nullif(value->>'y', '')::numeric as y,
      ordinality
    from jsonb_array_elements(p_document_positions) with ordinality
    where nullif(value->>'id', '') is not null
  ),
  latest as (
    select distinct on (id)
      id,
      x,
      y
    from parsed
    where x is not null
      and y is not null
    order by id, ordinality desc
  )
  update ms.document_nodes dn
  set
    pos_x = latest.x,
    pos_y = latest.y
  from latest
  where dn.id = latest.id
    and dn.map_id = p_map_id
    and (dn.pos_x is distinct from latest.x or dn.pos_y is distinct from latest.y);

  get diagnostics v_document_update_count = row_count;

  with parsed as (
    select
      nullif(value->>'id', '')::uuid as id,
      nullif(value->>'x', '')::numeric as x,
      nullif(value->>'y', '')::numeric as y,
      ordinality
    from jsonb_array_elements(p_element_positions) with ordinality
    where nullif(value->>'id', '') is not null
  ),
  latest as (
    select distinct on (id)
      id,
      x,
      y
    from parsed
    where x is not null
      and y is not null
    order by id, ordinality desc
  )
  update ms.canvas_elements ce
  set
    pos_x = latest.x,
    pos_y = latest.y
  from latest
  where ce.id = latest.id
    and ce.map_id = p_map_id
    and (ce.pos_x is distinct from latest.x or ce.pos_y is distinct from latest.y);

  get diagnostics v_element_update_count = row_count;

  if v_document_update_count > 0 or v_element_update_count > 0 then
    update ms.system_maps
    set
      updated_at = now(),
      updated_by_user_id = v_user_id
    where id = p_map_id;
  end if;
end;
$$;

revoke all on function public.update_system_map_item_positions(uuid, jsonb, jsonb) from public;
grant execute on function public.update_system_map_item_positions(uuid, jsonb, jsonb) to authenticated;
