-- Grant platform admin full product access without requiring paid billing.

create or replace function public.is_platform_admin(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select p_user_id in (
    '420266a0-2087-4f36-8c28-340443dd1a82'::uuid
  );
$$;

revoke all on function public.is_platform_admin(uuid) from public;
grant execute on function public.is_platform_admin(uuid) to authenticated;

create or replace function public.has_active_monthly_subscription(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    public.is_platform_admin(p_user_id)
    or exists (
      select 1
      from public.access_periods ap
      where ap.user_id = p_user_id
        and ap.access_type = 'subscription_monthly'
        and ap.access_status = 'active'
        and now() >= ap.starts_at
        and now() < ap.ends_at
    );
$$;

revoke all on function public.has_active_monthly_subscription(uuid) from public;
grant execute on function public.has_active_monthly_subscription(uuid) to authenticated;

create or replace function public.refresh_billing_profile_state(p_user_id uuid)
returns public.billing_profiles
language plpgsql
security definer
set search_path = public, ms
as $$
declare
  v_profile public.billing_profiles;
  v_active_period public.access_periods;
  v_latest_period public.access_periods;
  v_read_only_reason text;
  v_active_map_count integer := 0;
  v_effective_status public.access_status;
begin
  insert into public.billing_profiles (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  if public.is_platform_admin(p_user_id) then
    update public.billing_profiles bp
    set
      access_selection_required = false,
      current_access_type = 'subscription_monthly',
      current_access_status = 'active',
      current_access_period_id = null,
      current_stripe_subscription_id = null,
      current_stripe_price_id = null,
      current_period_starts_at = null,
      current_period_ends_at = null,
      read_only_reason = null,
      can_create_maps = true,
      can_edit_maps = true,
      can_export = true,
      can_share_maps = true,
      can_duplicate_maps = true
    where bp.user_id = p_user_id
    returning * into v_profile;

    return v_profile;
  end if;

  select *
  into v_active_period
  from public.access_periods ap
  where ap.user_id = p_user_id
    and ap.access_status = 'active'
    and now() >= ap.starts_at
    and now() < ap.ends_at
  order by ap.ends_at desc, ap.created_at desc
  limit 1;

  if v_active_period.id is not null then
    if v_active_period.map_limit is not null then
      select count(*)
      into v_active_map_count
      from ms.system_maps sm
      where sm.owner_id = p_user_id
        and sm.map_category = 'incident_investigation'
        and sm.created_via_access_period_id = v_active_period.id;
    end if;

    update public.billing_profiles bp
    set
      access_selection_required = false,
      current_access_type = v_active_period.access_type,
      current_access_status = 'active',
      current_access_period_id = v_active_period.id,
      current_stripe_subscription_id = v_active_period.stripe_subscription_id,
      current_stripe_price_id = v_active_period.stripe_price_id,
      current_period_starts_at = v_active_period.starts_at,
      current_period_ends_at = v_active_period.ends_at,
      read_only_reason = null,
      can_create_maps = v_active_period.write_allowed
        and (
          v_active_period.map_limit is null
          or v_active_map_count < v_active_period.map_limit
        ),
      can_edit_maps = v_active_period.write_allowed,
      can_export = v_active_period.export_allowed,
      can_share_maps = v_active_period.share_allowed,
      can_duplicate_maps = v_active_period.duplicate_allowed
    where bp.user_id = p_user_id
    returning * into v_profile;

    return v_profile;
  end if;

  select *
  into v_latest_period
  from public.access_periods ap
  where ap.user_id = p_user_id
  order by greatest(ap.ends_at, ap.starts_at) desc, ap.created_at desc
  limit 1;

  if v_latest_period.id is null then
    update public.billing_profiles bp
    set
      access_selection_required = true,
      current_access_type = null,
      current_access_status = 'selection_required',
      current_access_period_id = null,
      current_stripe_subscription_id = null,
      current_stripe_price_id = null,
      current_period_starts_at = null,
      current_period_ends_at = null,
      read_only_reason = null,
      can_create_maps = false,
      can_edit_maps = false,
      can_export = false,
      can_share_maps = false,
      can_duplicate_maps = false
    where bp.user_id = p_user_id
    returning * into v_profile;

    return v_profile;
  end if;

  v_effective_status := v_latest_period.access_status;

  if v_effective_status = 'active' and now() >= v_latest_period.ends_at then
    v_effective_status := 'expired';
  end if;

  v_read_only_reason :=
    case v_effective_status
      when 'payment_failed' then 'Payment failed. Your maps are read only until billing is updated.'
      when 'expired' then 'Your access period has expired. Your maps are read only.'
      when 'cancelled' then 'Your access has been cancelled. Your maps are read only.'
      when 'pending_activation' then 'Your access is still being activated.'
      else 'Access is restricted until an active access type is available.'
    end;

  update public.billing_profiles bp
  set
    access_selection_required = false,
    current_access_type = v_latest_period.access_type,
    current_access_status = v_effective_status,
    current_access_period_id = v_latest_period.id,
    current_stripe_subscription_id = v_latest_period.stripe_subscription_id,
    current_stripe_price_id = v_latest_period.stripe_price_id,
    current_period_starts_at = v_latest_period.starts_at,
    current_period_ends_at = v_latest_period.ends_at,
    read_only_reason = v_read_only_reason,
    can_create_maps = false,
    can_edit_maps = false,
    can_export = false,
    can_share_maps = false,
    can_duplicate_maps = false
  where bp.user_id = p_user_id
  returning * into v_profile;

  return v_profile;
end;
$$;

revoke all on function public.refresh_billing_profile_state(uuid) from public;
grant execute on function public.refresh_billing_profile_state(uuid) to authenticated;
