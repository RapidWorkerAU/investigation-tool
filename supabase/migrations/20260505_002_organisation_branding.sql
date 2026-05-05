alter table public.organisations add column if not exists logo_storage_path text;
alter table public.organisations add column if not exists section_heading_color text;
alter table public.organisations add column if not exists table_heading_color text;

update public.organisations
set section_heading_color = '#22344D'
where section_heading_color is null or btrim(section_heading_color) = '';

update public.organisations
set table_heading_color = '#7C8793'
where table_heading_color is null or btrim(table_heading_color) = '';

alter table public.organisations alter column section_heading_color set default '#22344D';
alter table public.organisations alter column table_heading_color set default '#7C8793';
alter table public.organisations alter column section_heading_color set not null;
alter table public.organisations alter column table_heading_color set not null;
