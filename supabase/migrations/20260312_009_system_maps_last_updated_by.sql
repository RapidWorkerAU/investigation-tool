-- 20260312_009_system_maps_last_updated_by.sql
-- Track the last user who edited a map and bubble child-table edits up to ms.system_maps.

alter table ms.system_maps
add column if not exists updated_by_user_id uuid references auth.users(id) on delete set null;

update ms.system_maps
set updated_by_user_id = owner_id
where updated_by_user_id is null;

create or replace function ms.set_system_map_updated_by()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.updated_by_user_id is null then
      new.updated_by_user_id := coalesce(auth.uid(), new.owner_id);
    end if;
    return new;
  end if;

  new.updated_by_user_id := coalesce(auth.uid(), new.updated_by_user_id, old.updated_by_user_id, old.owner_id);
  return new;
end;
$$;

drop trigger if exists trg_system_maps_updated_by on ms.system_maps;
create trigger trg_system_maps_updated_by
before insert or update on ms.system_maps
for each row
execute function ms.set_system_map_updated_by();

create or replace function ms.bump_parent_system_map()
returns trigger
language plpgsql
as $$
declare
  target_map_id uuid;
begin
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

drop trigger if exists trg_document_types_bump_system_map on ms.document_types;
create trigger trg_document_types_bump_system_map
after insert or update or delete on ms.document_types
for each row
execute function ms.bump_parent_system_map();

drop trigger if exists trg_document_nodes_bump_system_map on ms.document_nodes;
create trigger trg_document_nodes_bump_system_map
after insert or update or delete on ms.document_nodes
for each row
execute function ms.bump_parent_system_map();

drop trigger if exists trg_canvas_elements_bump_system_map on ms.canvas_elements;
create trigger trg_canvas_elements_bump_system_map
after insert or update or delete on ms.canvas_elements
for each row
execute function ms.bump_parent_system_map();

drop trigger if exists trg_node_relations_bump_system_map on ms.node_relations;
create trigger trg_node_relations_bump_system_map
after insert or update or delete on ms.node_relations
for each row
execute function ms.bump_parent_system_map();

drop trigger if exists trg_outline_items_bump_system_map on ms.document_outline_items;
create trigger trg_outline_items_bump_system_map
after insert or update or delete on ms.document_outline_items
for each row
execute function ms.bump_parent_system_map();

drop trigger if exists trg_map_members_bump_system_map on ms.map_members;
create trigger trg_map_members_bump_system_map
after insert or update or delete on ms.map_members
for each row
execute function ms.bump_parent_system_map();
