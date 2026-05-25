create or replace function ms.validate_canvas_anchor_link()
returns trigger
language plpgsql
set search_path = pg_catalog, ms
as $$
declare
  source_map_id uuid;
  source_element_type text;
  target_map_id uuid;
  target_element_type text;
begin
  select map_id, element_type
  into source_map_id, source_element_type
  from ms.canvas_elements
  where id = new.anchor_id;

  select map_id, element_type
  into target_map_id, target_element_type
  from ms.canvas_elements
  where id = new.linked_anchor_id;

  if source_map_id is null or target_map_id is null then
    raise exception 'Anchor link endpoints must exist';
  end if;

  if source_map_id <> new.map_id or target_map_id <> new.map_id then
    raise exception 'Anchor link endpoints must belong to the same map';
  end if;

  if source_element_type <> 'anchor' or target_element_type <> 'anchor' then
    raise exception 'Anchor links can only connect anchor nodes';
  end if;

  if new.sort_order < 0 then
    new.sort_order := 0;
  end if;

  return new;
end;
$$;

revoke all on function ms.validate_canvas_anchor_link() from public, anon, authenticated;

-- Trigger-only functions should not be callable through the HTTP API.
revoke all on function public.create_profile_for_new_auth_user() from public, anon, authenticated;
revoke all on function public.create_billing_profile_for_new_auth_user() from public, anon, authenticated;
revoke all on function public.sync_profile_email_from_auth() from public, anon, authenticated;

-- Server-only RPCs are reached through Next.js API routes after app-level checks.
revoke all on function public.accept_pending_organisation_invites(uuid, text) from public, anon, authenticated;
revoke all on function public.email_exists_for_auth(text) from public, anon, authenticated;
revoke all on function public.refresh_billing_profile_state(uuid) from public, anon, authenticated;
revoke all on function public.start_trial_access(uuid) from public, anon, authenticated;

grant execute on function public.accept_pending_organisation_invites(uuid, text) to service_role;
grant execute on function public.email_exists_for_auth(text) to service_role;
grant execute on function public.refresh_billing_profile_state(uuid) to service_role;
grant execute on function public.start_trial_access(uuid) to service_role;

-- No browser RPC should be callable before sign-in.
revoke all on function ms.link_map_to_profile_by_code(text) from public, anon;
revoke all on function ms.user_is_map_member(uuid) from public, anon;
revoke all on function public.create_investigation_map(text) from public, anon;
revoke all on function public.create_investigation_map_from_template(uuid, text, text) from public, anon;
revoke all on function public.create_template_editor_map(uuid) from public, anon;
revoke all on function public.delete_investigation_templates(uuid[]) from public, anon;
revoke all on function public.get_case_study_map_access(uuid) from public, anon;
revoke all on function public.has_active_monthly_subscription(uuid) from public, anon;
revoke all on function public.is_platform_admin(uuid) from public, anon;
revoke all on function public.list_case_study_maps() from public, anon;
revoke all on function public.list_investigation_maps() from public, anon;
revoke all on function public.list_investigation_templates(text, integer) from public, anon;
revoke all on function public.restore_system_map_session_snapshot(uuid, jsonb) from public, anon;
revoke all on function public.save_investigation_template(text, jsonb, uuid, boolean, text) from public, anon;
revoke all on function public.update_system_map_item_positions(uuid, jsonb, jsonb) from public, anon;
revoke all on function public.user_active_organisation_id(uuid) from public, anon;
revoke all on function public.user_can_edit_investigation_template(public.investigation_templates, uuid) from public, anon;
revoke all on function public.user_can_read_case_study_map(uuid) from public, anon;
revoke all on function public.user_can_read_investigation_template(public.investigation_templates, uuid) from public, anon;
revoke all on function public.user_has_active_org_access(uuid) from public, anon;
revoke all on function public.user_is_active_org_admin(uuid, uuid) from public, anon;

-- Keep the signed-in dashboard and case-study dashboard flows working.
grant execute on function ms.link_map_to_profile_by_code(text) to authenticated;
grant execute on function ms.user_is_map_member(uuid) to authenticated;
grant execute on function public.create_investigation_map(text) to authenticated;
grant execute on function public.create_investigation_map_from_template(uuid, text, text) to authenticated;
grant execute on function public.create_template_editor_map(uuid) to authenticated;
grant execute on function public.delete_investigation_templates(uuid[]) to authenticated;
grant execute on function public.get_case_study_map_access(uuid) to authenticated;
grant execute on function public.has_active_monthly_subscription(uuid) to authenticated;
grant execute on function public.is_platform_admin(uuid) to authenticated;
grant execute on function public.list_case_study_maps() to authenticated;
grant execute on function public.list_investigation_maps() to authenticated;
grant execute on function public.list_investigation_templates(text, integer) to authenticated;
grant execute on function public.restore_system_map_session_snapshot(uuid, jsonb) to authenticated;
grant execute on function public.save_investigation_template(text, jsonb, uuid, boolean, text) to authenticated;
grant execute on function public.update_system_map_item_positions(uuid, jsonb, jsonb) to authenticated;
grant execute on function public.user_active_organisation_id(uuid) to authenticated;
grant execute on function public.user_can_edit_investigation_template(public.investigation_templates, uuid) to authenticated;
grant execute on function public.user_can_read_case_study_map(uuid) to authenticated;
grant execute on function public.user_can_read_investigation_template(public.investigation_templates, uuid) to authenticated;
grant execute on function public.user_has_active_org_access(uuid) to authenticated;
grant execute on function public.user_is_active_org_admin(uuid, uuid) to authenticated;
