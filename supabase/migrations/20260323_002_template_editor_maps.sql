-- Hidden template editor maps for dashboard template editing flow.

alter table ms.system_maps
add column if not exists is_template_editor boolean not null default false;

alter table ms.system_maps
add column if not exists source_template_id uuid references public.investigation_templates(id) on delete set null;

create index if not exists idx_system_maps_template_editor
on ms.system_maps (owner_id, source_template_id)
where is_template_editor = true;

drop function if exists public.list_investigation_maps();

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
    and coalesce(sm.is_template_editor, false) = false
    and (
      sm.owner_id = auth.uid()
      or ms.user_is_map_member(sm.id)
    )
  order by sm.updated_at desc;
$$;

revoke all on function public.list_investigation_maps() from public;
grant execute on function public.list_investigation_maps() to authenticated;

create or replace function public.delete_investigation_templates(
  p_template_ids uuid[]
)
returns integer
language plpgsql
security definer
set search_path = public, ms
as $$
declare
  v_user_id uuid := auth.uid();
  v_deleted_count integer := 0;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if coalesce(array_length(p_template_ids, 1), 0) = 0 then
    return 0;
  end if;

  delete from ms.system_maps sm
  where sm.is_template_editor = true
    and sm.source_template_id = any(p_template_ids);

  delete from public.investigation_templates t
  where t.id = any(p_template_ids)
    and (
      (not t.is_global and t.user_id = v_user_id)
      or (t.is_global and public.is_platform_admin(v_user_id))
    );

  get diagnostics v_deleted_count = row_count;
  return v_deleted_count;
end;
$$;

revoke all on function public.delete_investigation_templates(uuid[]) from public;
grant execute on function public.delete_investigation_templates(uuid[]) to authenticated;

create or replace function public.create_template_editor_map(
  p_template_id uuid
)
returns table (
  map_id uuid,
  template_name text,
  is_global boolean
)
language plpgsql
security definer
set search_path = public, ms
as $$
declare
  v_user_id uuid := auth.uid();
  v_template public.investigation_templates;
  v_map_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select *
  into v_template
  from public.investigation_templates t
  where t.id = p_template_id
    and (
      (not t.is_global and t.user_id = v_user_id)
      or (t.is_global and public.is_platform_admin(v_user_id))
    );

  if v_template.id is null then
    raise exception 'Template not found or not editable';
  end if;

  delete from ms.system_maps sm
  where sm.owner_id = v_user_id
    and sm.is_template_editor = true
    and sm.source_template_id = p_template_id;

  select public.create_investigation_map_from_template(
    p_template_id,
    v_template.name,
    null
  )
  into v_map_id;

  update ms.system_maps
  set
    title = v_template.name,
    is_template_editor = true,
    source_template_id = p_template_id
  where id = v_map_id;

  return query
  select v_map_id, v_template.name, v_template.is_global;
end;
$$;

revoke all on function public.create_template_editor_map(uuid) from public;
grant execute on function public.create_template_editor_map(uuid) to authenticated;
