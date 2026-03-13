-- 20260312_008_document_types_upsert_constraint.sql
-- Support document_types upsert(onConflict: "map_id,name") used by the canvas bootstrap.

drop index if exists ms.idx_document_types_map_name_unique;

create unique index if not exists idx_document_types_map_name_unique
on ms.document_types (map_id, name);
