-- 20260312_002_ms_rls.sql
alter table public.profiles enable row level security;
alter table ms.system_maps enable row level security;
alter table ms.map_members enable row level security;
alter table ms.document_types enable row level security;
alter table ms.document_nodes enable row level security;
alter table ms.canvas_elements enable row level security;
alter table ms.node_relations enable row level security;
alter table ms.map_view_state enable row level security;
alter table ms.document_outline_items enable row level security;

-- profiles
drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles
for select to authenticated
using (id = auth.uid());

drop policy if exists profiles_self_write on public.profiles;
create policy profiles_self_write on public.profiles
for all to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- helper predicate via repeated exists
-- map access: owner or member
drop policy if exists system_maps_read on ms.system_maps;
create policy system_maps_read on ms.system_maps
for select to authenticated
using (
  owner_id = auth.uid()
  or exists (
    select 1 from ms.map_members mm
    where mm.map_id = system_maps.id and mm.user_id = auth.uid()
  )
);

drop policy if exists system_maps_insert on ms.system_maps;
create policy system_maps_insert on ms.system_maps
for insert to authenticated
with check (owner_id = auth.uid());

drop policy if exists system_maps_update_delete_owner on ms.system_maps;
create policy system_maps_update_delete_owner on ms.system_maps
for update to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists system_maps_delete_owner on ms.system_maps;
create policy system_maps_delete_owner on ms.system_maps
for delete to authenticated
using (owner_id = auth.uid());

drop policy if exists map_members_read on ms.map_members;
create policy map_members_read on ms.map_members
for select to authenticated
using (
  exists (
    select 1 from ms.system_maps sm
    where sm.id = map_members.map_id
      and (sm.owner_id = auth.uid() or exists (
        select 1 from ms.map_members mm where mm.map_id = map_members.map_id and mm.user_id = auth.uid()
      ))
  )
);

drop policy if exists map_members_owner_manage on ms.map_members;
create policy map_members_owner_manage on ms.map_members
for all to authenticated
using (
  exists (
    select 1 from ms.system_maps sm
    where sm.id = map_members.map_id and sm.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from ms.system_maps sm
    where sm.id = map_members.map_id and sm.owner_id = auth.uid()
  )
);

drop policy if exists document_types_read on ms.document_types;
create policy document_types_read on ms.document_types
for select to authenticated
using (
  map_id is null
  or exists (
    select 1 from ms.system_maps sm
    where sm.id = document_types.map_id
      and (sm.owner_id = auth.uid() or exists (
        select 1 from ms.map_members mm where mm.map_id = document_types.map_id and mm.user_id = auth.uid()
      ))
  )
);

drop policy if exists document_types_owner_write on ms.document_types;
create policy document_types_owner_write on ms.document_types
for all to authenticated
using (
  map_id is not null and exists (
    select 1 from ms.system_maps sm
    where sm.id = document_types.map_id and sm.owner_id = auth.uid()
  )
)
with check (
  map_id is not null and exists (
    select 1 from ms.system_maps sm
    where sm.id = document_types.map_id and sm.owner_id = auth.uid()
  )
);

drop policy if exists document_nodes_read on ms.document_nodes;
create policy document_nodes_read on ms.document_nodes
for select to authenticated
using (
  exists (
    select 1 from ms.system_maps sm
    where sm.id = document_nodes.map_id
      and (sm.owner_id = auth.uid() or exists (
        select 1 from ms.map_members mm where mm.map_id = document_nodes.map_id and mm.user_id = auth.uid()
      ))
  )
);

drop policy if exists document_nodes_write on ms.document_nodes;
create policy document_nodes_write on ms.document_nodes
for all to authenticated
using (
  exists (
    select 1
    from ms.system_maps sm
    left join ms.map_members mm on mm.map_id = sm.id and mm.user_id = auth.uid()
    where sm.id = document_nodes.map_id and (sm.owner_id = auth.uid() or mm.role in ('partial_write','full_write'))
  )
)
with check (
  exists (
    select 1
    from ms.system_maps sm
    left join ms.map_members mm on mm.map_id = sm.id and mm.user_id = auth.uid()
    where sm.id = document_nodes.map_id and (sm.owner_id = auth.uid() or mm.role in ('partial_write','full_write'))
  )
);

drop policy if exists canvas_elements_read on ms.canvas_elements;
create policy canvas_elements_read on ms.canvas_elements
for select to authenticated
using (
  exists (
    select 1 from ms.system_maps sm
    where sm.id = canvas_elements.map_id
      and (sm.owner_id = auth.uid() or exists (
        select 1 from ms.map_members mm where mm.map_id = canvas_elements.map_id and mm.user_id = auth.uid()
      ))
  )
);

drop policy if exists canvas_elements_write on ms.canvas_elements;
create policy canvas_elements_write on ms.canvas_elements
for all to authenticated
using (
  exists (
    select 1
    from ms.system_maps sm
    left join ms.map_members mm on mm.map_id = sm.id and mm.user_id = auth.uid()
    where sm.id = canvas_elements.map_id and (sm.owner_id = auth.uid() or mm.role in ('partial_write','full_write'))
  )
)
with check (
  exists (
    select 1
    from ms.system_maps sm
    left join ms.map_members mm on mm.map_id = sm.id and mm.user_id = auth.uid()
    where sm.id = canvas_elements.map_id and (sm.owner_id = auth.uid() or mm.role in ('partial_write','full_write'))
  )
);

drop policy if exists node_relations_read on ms.node_relations;
create policy node_relations_read on ms.node_relations
for select to authenticated
using (
  exists (
    select 1 from ms.system_maps sm
    where sm.id = node_relations.map_id
      and (sm.owner_id = auth.uid() or exists (
        select 1 from ms.map_members mm where mm.map_id = node_relations.map_id and mm.user_id = auth.uid()
      ))
  )
);

drop policy if exists node_relations_write on ms.node_relations;
create policy node_relations_write on ms.node_relations
for all to authenticated
using (
  exists (
    select 1
    from ms.system_maps sm
    left join ms.map_members mm on mm.map_id = sm.id and mm.user_id = auth.uid()
    where sm.id = node_relations.map_id and (sm.owner_id = auth.uid() or mm.role in ('partial_write','full_write'))
  )
)
with check (
  exists (
    select 1
    from ms.system_maps sm
    left join ms.map_members mm on mm.map_id = sm.id and mm.user_id = auth.uid()
    where sm.id = node_relations.map_id and (sm.owner_id = auth.uid() or mm.role in ('partial_write','full_write'))
  )
);

drop policy if exists map_view_state_read on ms.map_view_state;
create policy map_view_state_read on ms.map_view_state
for select to authenticated
using (user_id = auth.uid());

drop policy if exists map_view_state_write on ms.map_view_state;
create policy map_view_state_write on ms.map_view_state
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists outline_read on ms.document_outline_items;
create policy outline_read on ms.document_outline_items
for select to authenticated
using (
  exists (
    select 1 from ms.system_maps sm
    where sm.id = document_outline_items.map_id
      and (sm.owner_id = auth.uid() or exists (
        select 1 from ms.map_members mm where mm.map_id = document_outline_items.map_id and mm.user_id = auth.uid()
      ))
  )
);

drop policy if exists outline_write on ms.document_outline_items;
create policy outline_write on ms.document_outline_items
for all to authenticated
using (
  exists (
    select 1
    from ms.system_maps sm
    left join ms.map_members mm on mm.map_id = sm.id and mm.user_id = auth.uid()
    where sm.id = document_outline_items.map_id and (sm.owner_id = auth.uid() or mm.role in ('partial_write','full_write'))
  )
)
with check (
  exists (
    select 1
    from ms.system_maps sm
    left join ms.map_members mm on mm.map_id = sm.id and mm.user_id = auth.uid()
    where sm.id = document_outline_items.map_id and (sm.owner_id = auth.uid() or mm.role in ('partial_write','full_write'))
  )
);

-- storage policies for investigation canvas attachments/images
drop policy if exists "systemmap storage read" on storage.objects;
create policy "systemmap storage read" on storage.objects
for select to authenticated
using (bucket_id = 'systemmap');

drop policy if exists "systemmap storage write" on storage.objects;
create policy "systemmap storage write" on storage.objects
for insert to authenticated
with check (bucket_id = 'systemmap');

drop policy if exists "systemmap storage update" on storage.objects;
create policy "systemmap storage update" on storage.objects
for update to authenticated
using (bucket_id = 'systemmap')
with check (bucket_id = 'systemmap');

drop policy if exists "systemmap storage delete" on storage.objects;
create policy "systemmap storage delete" on storage.objects
for delete to authenticated
using (bucket_id = 'systemmap');



