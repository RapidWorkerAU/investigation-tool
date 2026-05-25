create or replace function public.is_platform_admin(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public, auth
stable
as $$
  select
    p_user_id is not null
    and (
      auth.role() = 'service_role'
      or auth.uid() = p_user_id
    )
    and p_user_id in (
      '420266a0-2087-4f36-8c28-340443dd1a82'::uuid
    );
$$;

revoke all on function public.is_platform_admin(uuid) from public, anon;
grant execute on function public.is_platform_admin(uuid) to authenticated;

create or replace function public.has_active_monthly_subscription(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public, auth
stable
as $$
  select
    p_user_id is not null
    and (
      auth.role() = 'service_role'
      or auth.uid() = p_user_id
    )
    and (
      public.is_platform_admin(p_user_id)
      or exists (
        select 1
        from public.access_periods ap
        where ap.user_id = p_user_id
          and ap.access_type = 'subscription_monthly'
          and ap.access_status = 'active'
          and now() >= ap.starts_at
          and now() < ap.ends_at
      )
    );
$$;

revoke all on function public.has_active_monthly_subscription(uuid) from public, anon;
grant execute on function public.has_active_monthly_subscription(uuid) to authenticated;

create or replace function public.user_has_active_org_access(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    p_user_id is not null
    and (
      auth.role() = 'service_role'
      or auth.uid() = p_user_id
    )
    and exists (
      select 1
      from public.organisation_memberships membership
      join public.organisations org
        on org.id = membership.organisation_id
       and org.status = 'active'
      where membership.user_id = p_user_id
        and membership.invite_status = 'active'
    );
$$;

revoke all on function public.user_has_active_org_access(uuid) from public, anon;
grant execute on function public.user_has_active_org_access(uuid) to authenticated;

create or replace function public.user_active_organisation_id(p_user_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select membership.organisation_id
  from public.organisation_memberships membership
  join public.organisations org
    on org.id = membership.organisation_id
   and org.status = 'active'
  where p_user_id is not null
    and (
      auth.role() = 'service_role'
      or auth.uid() = p_user_id
    )
    and membership.user_id = p_user_id
    and membership.invite_status = 'active'
  order by membership.joined_at nulls last, membership.created_at
  limit 1;
$$;

revoke all on function public.user_active_organisation_id(uuid) from public, anon;
grant execute on function public.user_active_organisation_id(uuid) to authenticated;

create or replace function public.user_is_active_org_admin(p_user_id uuid, p_organisation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    p_user_id is not null
    and (
      auth.role() = 'service_role'
      or auth.uid() = p_user_id
    )
    and exists (
      select 1
      from public.organisation_memberships membership
      join public.organisations org
        on org.id = membership.organisation_id
       and org.status = 'active'
      where membership.user_id = p_user_id
        and membership.organisation_id = p_organisation_id
        and membership.invite_status = 'active'
        and membership.role = 'org_admin'
    );
$$;

revoke all on function public.user_is_active_org_admin(uuid, uuid) from public, anon;
grant execute on function public.user_is_active_org_admin(uuid, uuid) to authenticated;

create or replace function public.user_can_read_investigation_template(p_template public.investigation_templates, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    p_user_id is not null
    and (
      auth.role() = 'service_role'
      or auth.uid() = p_user_id
    )
    and (
      p_template.visibility = 'global'
      or (p_template.visibility = 'private' and p_template.user_id = p_user_id)
      or (
        p_template.visibility = 'organisation'
        and exists (
          select 1
          from public.organisation_memberships membership
          join public.organisations org
            on org.id = membership.organisation_id
           and org.status = 'active'
          where membership.user_id = p_user_id
            and membership.organisation_id = p_template.organisation_id
            and membership.invite_status = 'active'
        )
      )
    );
$$;

revoke all on function public.user_can_read_investigation_template(public.investigation_templates, uuid) from public, anon;
grant execute on function public.user_can_read_investigation_template(public.investigation_templates, uuid) to authenticated;

create or replace function public.user_can_edit_investigation_template(p_template public.investigation_templates, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    p_user_id is not null
    and (
      auth.role() = 'service_role'
      or auth.uid() = p_user_id
    )
    and (
      p_template.user_id = p_user_id
      or public.is_platform_admin(p_user_id)
      or (
        p_template.visibility = 'organisation'
        and public.user_is_active_org_admin(p_user_id, p_template.organisation_id)
      )
    );
$$;

revoke all on function public.user_can_edit_investigation_template(public.investigation_templates, uuid) from public, anon;
grant execute on function public.user_can_edit_investigation_template(public.investigation_templates, uuid) to authenticated;
