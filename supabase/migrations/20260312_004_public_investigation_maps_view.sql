-- 20260312_004_public_investigation_maps_view.sql
create or replace view public.investigation_maps with (security_invoker = true) as
select
  sm.id,
  sm.title,
  sm.description,
  sm.map_code,
  sm.map_category,
  sm.owner_id,
  sm.created_at,
  sm.updated_at
from ms.system_maps sm;

grant select on public.investigation_maps to authenticated;
