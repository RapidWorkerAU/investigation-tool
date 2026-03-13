-- 20260312_005_fix_map_members_rls_recursion.sql
-- Avoid recursive policy evaluation on ms.map_members by not querying ms.map_members
-- from inside a select policy on ms.map_members.

drop policy if exists map_members_read on ms.map_members;

create policy map_members_read on ms.map_members
for select to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from ms.system_maps sm
    where sm.id = map_members.map_id
      and sm.owner_id = auth.uid()
  )
);
