-- 20260312_010_list_investigation_maps_rpc.sql
-- Return dashboard-ready investigation map rows, including owner and last editor email,
-- without exposing unrelated profile data through broad RLS changes.

create or replace function public.list_investigation_maps()
returns table (
  id uuid,
  title text,
  description text,
  map_code text,
  owner_id uuid,
  updated_by_user_id uuid,
  owner_email text,
  access_count bigint,
  updated_by_email text,
  role text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public, ms
as $$
  select
    sm.id,
    sm.title,
    sm.description,
    sm.map_code,
    sm.owner_id,
    sm.updated_by_user_id,
    coalesce(owner_profile.email, owner_auth.email) as owner_email,
    (
      select count(*)
      from ms.map_members member_count
      where member_count.map_id = sm.id
    ) as access_count,
    coalesce(updated_profile.email, updated_auth.email) as updated_by_email,
    case
      when sm.owner_id = auth.uid() then 'full_write'
      else coalesce(current_member.role, 'read')
    end as role,
    sm.created_at,
    sm.updated_at
  from ms.system_maps sm
  left join ms.map_members current_member
    on current_member.map_id = sm.id
   and current_member.user_id = auth.uid()
  left join public.profiles owner_profile
    on owner_profile.id = sm.owner_id
  left join public.profiles updated_profile
    on updated_profile.id = sm.updated_by_user_id
  left join auth.users owner_auth
    on owner_auth.id = sm.owner_id
  left join auth.users updated_auth
    on updated_auth.id = sm.updated_by_user_id
  where auth.uid() is not null
    and (
      sm.owner_id = auth.uid()
      or ms.user_is_map_member(sm.id)
    )
  order by sm.updated_at desc;
$$;

revoke all on function public.list_investigation_maps() from public;
grant execute on function public.list_investigation_maps() to authenticated;
