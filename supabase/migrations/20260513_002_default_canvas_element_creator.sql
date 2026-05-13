-- Template snapshots intentionally do not preserve canvas element creators.
-- When a user creates a map from a template, cloned elements should belong to
-- the new map creator instead of rendering as "Unknown user".

create or replace function ms.default_canvas_element_creator()
returns trigger
language plpgsql
set search_path = pg_catalog, auth, ms
as $$
begin
  if new.created_by_user_id is null then
    new.created_by_user_id := auth.uid();
  end if;

  return new;
end;
$$;

drop trigger if exists trg_canvas_elements_default_creator on ms.canvas_elements;
create trigger trg_canvas_elements_default_creator
before insert on ms.canvas_elements
for each row
execute function ms.default_canvas_element_creator();

update ms.canvas_elements ce
set created_by_user_id = sm.owner_id
from ms.system_maps sm
where ce.map_id = sm.id
  and ce.created_by_user_id is null;
