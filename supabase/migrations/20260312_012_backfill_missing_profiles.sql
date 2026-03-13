-- 20260312_012_backfill_missing_profiles.sql
-- Ensure every auth user has a corresponding public.profiles row.

insert into public.profiles (id, email, full_name)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', '')
from auth.users u
left join public.profiles p
  on p.id = u.id
where p.id is null;

create or replace function public.create_profile_for_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = case
          when coalesce(public.profiles.full_name, '') = '' then excluded.full_name
          else public.profiles.full_name
        end;

  return new;
end;
$$;

drop trigger if exists trg_create_profile_for_new_auth_user on auth.users;
create trigger trg_create_profile_for_new_auth_user
after insert on auth.users
for each row
execute function public.create_profile_for_new_auth_user();
