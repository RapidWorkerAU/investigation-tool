-- Allow users to read maps owned by users in the same active organisation.
-- This does not grant write access. Explicit ms.map_members roles still control write behavior.

create or replace function ms.user_is_map_member(target_map_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, ms
as $$
  select
    auth.uid() is not null
    and (
      exists (
        select 1
        from ms.map_members
        where map_id = target_map_id
          and user_id = auth.uid()
      )
      or exists (
        select 1
        from ms.system_maps sm
        join public.organisation_memberships viewer_membership
          on viewer_membership.user_id = auth.uid()
         and viewer_membership.invite_status = 'active'
        join public.organisation_memberships owner_membership
          on owner_membership.user_id = sm.owner_id
         and owner_membership.organisation_id = viewer_membership.organisation_id
         and owner_membership.invite_status = 'active'
        join public.organisations org
          on org.id = viewer_membership.organisation_id
         and org.status = 'active'
        where sm.id = target_map_id
          and sm.owner_id <> auth.uid()
      )
    );
$$;

revoke all on function ms.user_is_map_member(uuid) from public;
grant execute on function ms.user_is_map_member(uuid) to authenticated;
