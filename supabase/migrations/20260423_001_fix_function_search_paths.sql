-- Fix Supabase advisor warnings for mutable function search paths.
-- Pin each function to the minimum schema set it needs.

create or replace function ms.touch_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, ms
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function ms.set_system_map_updated_by()
returns trigger
language plpgsql
set search_path = pg_catalog, auth, ms
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

create or replace function ms.bump_parent_system_map()
returns trigger
language plpgsql
set search_path = pg_catalog, auth, ms
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

create or replace function public.touch_updated_at_public()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
