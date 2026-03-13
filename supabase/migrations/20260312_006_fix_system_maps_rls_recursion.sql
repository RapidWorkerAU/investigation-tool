-- 20260312_006_fix_system_maps_rls_recursion.sql
-- Break recursive RLS evaluation between ms.system_maps and ms.map_members.

create or replace function ms.user_is_map_member(target_map_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, ms
as $$
  select exists (
    select 1
    from ms.map_members
    where map_id = target_map_id
      and user_id = auth.uid()
  );
$$;

revoke all on function ms.user_is_map_member(uuid) from public;
grant execute on function ms.user_is_map_member(uuid) to authenticated;

drop policy if exists system_maps_read on ms.system_maps;
create policy system_maps_read on ms.system_maps
for select to authenticated
using (
  owner_id = auth.uid()
  or ms.user_is_map_member(id)
);

drop policy if exists document_types_read on ms.document_types;
create policy document_types_read on ms.document_types
for select to authenticated
using (
  map_id is null
  or exists (
    select 1
    from ms.system_maps sm
    where sm.id = document_types.map_id
      and (sm.owner_id = auth.uid() or ms.user_is_map_member(document_types.map_id))
  )
);

drop policy if exists document_nodes_read on ms.document_nodes;
create policy document_nodes_read on ms.document_nodes
for select to authenticated
using (
  exists (
    select 1
    from ms.system_maps sm
    where sm.id = document_nodes.map_id
      and (sm.owner_id = auth.uid() or ms.user_is_map_member(document_nodes.map_id))
  )
);

drop policy if exists canvas_elements_read on ms.canvas_elements;
create policy canvas_elements_read on ms.canvas_elements
for select to authenticated
using (
  exists (
    select 1
    from ms.system_maps sm
    where sm.id = canvas_elements.map_id
      and (sm.owner_id = auth.uid() or ms.user_is_map_member(canvas_elements.map_id))
  )
);

drop policy if exists node_relations_read on ms.node_relations;
create policy node_relations_read on ms.node_relations
for select to authenticated
using (
  exists (
    select 1
    from ms.system_maps sm
    where sm.id = node_relations.map_id
      and (sm.owner_id = auth.uid() or ms.user_is_map_member(node_relations.map_id))
  )
);

drop policy if exists outline_read on ms.document_outline_items;
create policy outline_read on ms.document_outline_items
for select to authenticated
using (
  exists (
    select 1
    from ms.system_maps sm
    where sm.id = document_outline_items.map_id
      and (sm.owner_id = auth.uid() or ms.user_is_map_member(document_outline_items.map_id))
  )
);
