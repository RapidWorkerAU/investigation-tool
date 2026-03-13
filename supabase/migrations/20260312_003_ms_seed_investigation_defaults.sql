-- 20260312_003_ms_seed_investigation_defaults.sql
-- optional starter document types (map-specific types will be auto-created by app if missing)
insert into ms.document_types (map_id, name, level_rank, is_active)
values
  (null, 'Investigation Plan', 1, true),
  (null, 'Evidence Register', 2, true),
  (null, 'Findings', 3, true),
  (null, 'Actions', 4, true)
on conflict do nothing;
