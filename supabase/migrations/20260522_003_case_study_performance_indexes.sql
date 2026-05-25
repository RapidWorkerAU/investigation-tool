create index if not exists idx_lead_map_campaigns_active_map
  on public.lead_map_campaigns (map_id, created_at desc)
  where is_active = true;

create index if not exists idx_canvas_elements_map_type_created
  on ms.canvas_elements (map_id, element_type, created_at);
