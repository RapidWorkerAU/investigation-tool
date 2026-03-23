-- Fix ambiguous output-column references inside save_investigation_template.

create or replace function public.save_investigation_template(
  p_name text,
  p_snapshot jsonb,
  p_template_id uuid default null,
  p_is_global boolean default false
)
returns table (
  id uuid,
  name text,
  updated_at timestamptz,
  was_overwritten boolean,
  is_global boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_name text := btrim(coalesce(p_name, ''));
  v_template public.investigation_templates;
  v_overwritten boolean := false;
  v_is_admin boolean := false;
  v_is_global boolean := coalesce(p_is_global, false);
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.has_active_monthly_subscription(v_user_id) then
    raise exception 'Templates are only available for active subscription holders';
  end if;

  v_is_admin := public.is_platform_admin(v_user_id);

  if v_is_global and not v_is_admin then
    raise exception 'Only platform admins can save global templates';
  end if;

  if v_name = '' then
    raise exception 'Template name is required';
  end if;

  if p_snapshot is null or jsonb_typeof(p_snapshot) <> 'object' then
    raise exception 'Template snapshot is invalid';
  end if;

  if p_template_id is not null then
    select *
    into v_template
    from public.investigation_templates t
    where t.id = p_template_id
      and (
        (not t.is_global and t.user_id = v_user_id)
        or (v_is_admin and t.is_global)
      );

    if v_template.id is null then
      raise exception 'Template not found';
    end if;

    if v_template.is_global <> v_is_global then
      raise exception 'Template scope changed. Re-select the template before saving.';
    end if;
  else
    select *
    into v_template
    from public.investigation_templates t
    where t.name_normalized = lower(v_name)
      and (
        (v_is_global and t.is_global)
        or (not v_is_global and not t.is_global and t.user_id = v_user_id)
      );
  end if;

  if v_template.id is null then
    insert into public.investigation_templates (
      user_id,
      name,
      map_category,
      snapshot,
      is_global
    )
    values (
      v_user_id,
      v_name,
      'incident_investigation',
      p_snapshot,
      v_is_global
    )
    returning * into v_template;
  else
    update public.investigation_templates t
    set
      name = v_name,
      snapshot = p_snapshot
    where t.id = v_template.id
    returning * into v_template;

    v_overwritten := true;
  end if;

  return query
  select v_template.id, v_template.name, v_template.updated_at, v_overwritten, v_template.is_global;
end;
$$;

revoke all on function public.save_investigation_template(text, jsonb, uuid, boolean) from public;
grant execute on function public.save_investigation_template(text, jsonb, uuid, boolean) to authenticated;
