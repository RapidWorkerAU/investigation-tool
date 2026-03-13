-- 20260312_001_ms_core.sql
create extension if not exists pgcrypto;

create schema if not exists ms;

create or replace function ms.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ms.system_maps (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  owner_id uuid not null references auth.users(id) on delete cascade,
  map_code text,
  map_category text not null default 'incident_investigation' check (map_category = 'incident_investigation'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ms.map_members (
  map_id uuid not null references ms.system_maps(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'read' check (role in ('read','partial_write','full_write')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (map_id, user_id)
);

create table if not exists ms.document_types (
  id uuid primary key default gen_random_uuid(),
  map_id uuid references ms.system_maps(id) on delete cascade,
  name text not null,
  level_rank integer not null,
  band_y_min numeric,
  band_y_max numeric,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ms.document_nodes (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references ms.system_maps(id) on delete cascade,
  type_id uuid not null references ms.document_types(id) on delete restrict,
  title text not null default 'Untitled Document',
  document_number text,
  discipline text,
  owner_user_id uuid references auth.users(id) on delete set null,
  owner_name text,
  user_group text,
  pos_x numeric not null default 0,
  pos_y numeric not null default 0,
  width numeric,
  height numeric,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ms.canvas_elements (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references ms.system_maps(id) on delete cascade,
  element_type text not null,
  heading text not null default '',
  color_hex text,
  created_by_user_id uuid references auth.users(id) on delete set null,
  element_config jsonb,
  pos_x numeric not null default 0,
  pos_y numeric not null default 0,
  width numeric not null default 168,
  height numeric not null default 96,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint canvas_elements_element_type_check check (
    element_type = any (
      array[
        'category'::text,
        'system_circle'::text,
        'grouping_container'::text,
        'process_component'::text,
        'sticky_note'::text,
        'person'::text,
        'image_asset'::text,
        'text_box'::text,
        'table'::text,
        'shape_rectangle'::text,
        'shape_circle'::text,
        'shape_pill'::text,
        'shape_pentagon'::text,
        'shape_chevron_left'::text,
        'shape_arrow'::text,
        'bowtie_hazard'::text,
        'bowtie_top_event'::text,
        'bowtie_threat'::text,
        'bowtie_consequence'::text,
        'bowtie_control'::text,
        'bowtie_escalation_factor'::text,
        'bowtie_recovery_measure'::text,
        'bowtie_degradation_indicator'::text,
        'bowtie_risk_rating'::text,
        'incident_sequence_step'::text,
        'incident_outcome'::text,
        'incident_task_condition'::text,
        'incident_factor'::text,
        'incident_system_factor'::text,
        'incident_control_barrier'::text,
        'incident_evidence'::text,
        'incident_finding'::text,
        'incident_recommendation'::text
      ]
    )
  )
);

create table if not exists ms.node_relations (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references ms.system_maps(id) on delete cascade,
  from_node_id uuid references ms.document_nodes(id) on delete cascade,
  source_system_element_id uuid references ms.canvas_elements(id) on delete cascade,
  to_node_id uuid references ms.document_nodes(id) on delete cascade,
  source_grouping_element_id uuid references ms.canvas_elements(id) on delete cascade,
  target_grouping_element_id uuid references ms.canvas_elements(id) on delete cascade,
  relation_type text not null default 'related',
  relationship_description text,
  target_system_element_id uuid references ms.canvas_elements(id) on delete cascade,
  relationship_disciplines text[],
  relationship_category text,
  relationship_custom_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ms.map_view_state (
  map_id uuid not null references ms.system_maps(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  pan_x numeric not null default 0,
  pan_y numeric not null default 0,
  zoom numeric not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (map_id, user_id)
);

create table if not exists ms.document_outline_items (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references ms.system_maps(id) on delete cascade,
  node_id uuid not null references ms.document_nodes(id) on delete cascade,
  kind text not null check (kind in ('heading','content')),
  heading_level integer check (heading_level in (1,2,3)),
  parent_heading_id uuid references ms.document_outline_items(id) on delete set null,
  heading_id uuid references ms.document_outline_items(id) on delete set null,
  title text,
  content_text text,
  sort_order integer not null default 10,
  created_at timestamptz not null default now()
);

create or replace view ms.map_member_profiles with (security_invoker = true) as
select
  m.map_id,
  m.user_id,
  m.role,
  p.email,
  p.full_name,
  (sm.owner_id = m.user_id) as is_owner
from ms.map_members m
join ms.system_maps sm on sm.id = m.map_id
left join public.profiles p on p.id = m.user_id;

create index if not exists idx_system_maps_owner on ms.system_maps(owner_id);
create index if not exists idx_document_nodes_map on ms.document_nodes(map_id);
create index if not exists idx_canvas_elements_map on ms.canvas_elements(map_id);
create index if not exists idx_node_relations_map on ms.node_relations(map_id);
create index if not exists idx_document_types_map on ms.document_types(map_id);
create index if not exists idx_outline_map_node on ms.document_outline_items(map_id, node_id);

create trigger trg_profiles_updated_at before update on public.profiles for each row execute function ms.touch_updated_at();
create trigger trg_system_maps_updated_at before update on ms.system_maps for each row execute function ms.touch_updated_at();
create trigger trg_map_members_updated_at before update on ms.map_members for each row execute function ms.touch_updated_at();
create trigger trg_document_types_updated_at before update on ms.document_types for each row execute function ms.touch_updated_at();
create trigger trg_document_nodes_updated_at before update on ms.document_nodes for each row execute function ms.touch_updated_at();
create trigger trg_canvas_elements_updated_at before update on ms.canvas_elements for each row execute function ms.touch_updated_at();
create trigger trg_node_relations_updated_at before update on ms.node_relations for each row execute function ms.touch_updated_at();
create trigger trg_map_view_state_updated_at before update on ms.map_view_state for each row execute function ms.touch_updated_at();

insert into storage.buckets (id, name, public)
values ('systemmap', 'systemmap', false)
on conflict (id) do nothing;

grant usage on schema ms to authenticated;
grant select, insert, update, delete on all tables in schema ms to authenticated;
grant usage, select on all sequences in schema ms to authenticated;
grant select on ms.map_member_profiles to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
