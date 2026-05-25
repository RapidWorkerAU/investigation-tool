create or replace function public.user_can_read_case_study_map(p_map_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, ms
as $$
  select
    auth.uid() is not null
    and exists (
      select 1
      from public.lead_map_campaigns campaign
      where campaign.map_id = p_map_id
        and campaign.is_active = true
    );
$$;

revoke all on function public.user_can_read_case_study_map(uuid) from public;
grant execute on function public.user_can_read_case_study_map(uuid) to authenticated;

create index if not exists idx_lead_map_campaigns_active_map
  on public.lead_map_campaigns (map_id, created_at desc)
  where is_active = true;

create index if not exists idx_canvas_elements_map_type_created
  on ms.canvas_elements (map_id, element_type, created_at);

create or replace function public.list_case_study_maps()
returns table (
  id uuid,
  slug text,
  title text,
  description text,
  campaign_title text,
  campaign_description text,
  owner_id uuid,
  owner_email text,
  updated_by_user_id uuid,
  updated_by_email text,
  session_duration_hours integer,
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
    campaign.slug,
    sm.title,
    sm.description,
    campaign.title as campaign_title,
    campaign.description as campaign_description,
    sm.owner_id,
    coalesce(owner_profile.email, owner_auth.email) as owner_email,
    sm.updated_by_user_id,
    coalesce(updated_profile.email, updated_auth.email) as updated_by_email,
    campaign.session_duration_hours,
    sm.created_at,
    sm.updated_at
  from public.lead_map_campaigns campaign
  join ms.system_maps sm
    on sm.id = campaign.map_id
  left join public.profiles owner_profile
    on owner_profile.id = sm.owner_id
  left join public.profiles updated_profile
    on updated_profile.id = sm.updated_by_user_id
  left join auth.users owner_auth
    on owner_auth.id = sm.owner_id
  left join auth.users updated_auth
    on updated_auth.id = sm.updated_by_user_id
  where auth.uid() is not null
    and campaign.is_active = true
    and coalesce(sm.is_template_editor, false) = false
  order by sm.updated_at desc;
$$;

revoke all on function public.list_case_study_maps() from public;
grant execute on function public.list_case_study_maps() to authenticated;

create or replace function public.get_case_study_map_access(p_map_id uuid)
returns table (
  id uuid,
  slug text,
  campaign_title text,
  campaign_description text,
  owner_email text,
  session_duration_hours integer
)
language sql
stable
security definer
set search_path = public, ms
as $$
  select
    campaign.map_id as id,
    campaign.slug,
    campaign.title as campaign_title,
    campaign.description as campaign_description,
    coalesce(owner_profile.email, owner_auth.email) as owner_email,
    campaign.session_duration_hours
  from public.lead_map_campaigns campaign
  join ms.system_maps sm
    on sm.id = campaign.map_id
  left join public.profiles owner_profile
    on owner_profile.id = sm.owner_id
  left join auth.users owner_auth
    on owner_auth.id = sm.owner_id
  where auth.uid() is not null
    and campaign.map_id = p_map_id
    and campaign.is_active = true
    and coalesce(sm.is_template_editor, false) = false
  order by campaign.created_at desc
  limit 1;
$$;

revoke all on function public.get_case_study_map_access(uuid) from public;
grant execute on function public.get_case_study_map_access(uuid) to authenticated;

drop policy if exists system_maps_read on ms.system_maps;
create policy system_maps_read on ms.system_maps
for select to authenticated
using (
  owner_id = auth.uid()
  or ms.user_is_map_member(id)
  or public.user_can_read_case_study_map(id)
);

drop policy if exists document_types_read on ms.document_types;
create policy document_types_read on ms.document_types
for select to authenticated
using (
  map_id is null
  or exists (
    select 1
    from ms.system_maps sm
    where sm.id = document_types.map_id
      and (
        sm.owner_id = auth.uid()
        or ms.user_is_map_member(document_types.map_id)
        or public.user_can_read_case_study_map(document_types.map_id)
      )
  )
);

drop policy if exists document_nodes_read on ms.document_nodes;
create policy document_nodes_read on ms.document_nodes
for select to authenticated
using (
  exists (
    select 1
    from ms.system_maps sm
    where sm.id = document_nodes.map_id
      and (
        sm.owner_id = auth.uid()
        or ms.user_is_map_member(document_nodes.map_id)
        or public.user_can_read_case_study_map(document_nodes.map_id)
      )
  )
);

drop policy if exists canvas_elements_read on ms.canvas_elements;
create policy canvas_elements_read on ms.canvas_elements
for select to authenticated
using (
  exists (
    select 1
    from ms.system_maps sm
    where sm.id = canvas_elements.map_id
      and (
        sm.owner_id = auth.uid()
        or ms.user_is_map_member(canvas_elements.map_id)
        or public.user_can_read_case_study_map(canvas_elements.map_id)
      )
  )
);

drop policy if exists node_relations_read on ms.node_relations;
create policy node_relations_read on ms.node_relations
for select to authenticated
using (
  exists (
    select 1
    from ms.system_maps sm
    where sm.id = node_relations.map_id
      and (
        sm.owner_id = auth.uid()
        or ms.user_is_map_member(node_relations.map_id)
        or public.user_can_read_case_study_map(node_relations.map_id)
      )
  )
);

drop policy if exists outline_read on ms.document_outline_items;
create policy outline_read on ms.document_outline_items
for select to authenticated
using (
  exists (
    select 1
    from ms.system_maps sm
    where sm.id = document_outline_items.map_id
      and (
        sm.owner_id = auth.uid()
        or ms.user_is_map_member(document_outline_items.map_id)
        or public.user_can_read_case_study_map(document_outline_items.map_id)
      )
  )
);

drop policy if exists canvas_anchor_links_read on ms.canvas_anchor_links;
create policy canvas_anchor_links_read on ms.canvas_anchor_links
for select to authenticated
using (
  exists (
    select 1
    from ms.system_maps sm
    where sm.id = canvas_anchor_links.map_id
      and (
        sm.owner_id = auth.uid()
        or ms.user_is_map_member(canvas_anchor_links.map_id)
        or public.user_can_read_case_study_map(canvas_anchor_links.map_id)
      )
  )
);
