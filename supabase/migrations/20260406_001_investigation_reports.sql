create table if not exists ms.investigation_reports (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references ms.system_maps(id) on delete cascade,
  generated_by_user_id uuid references auth.users(id) on delete set null,
  generated_at timestamptz not null default now(),
  input_snapshot_json jsonb not null,
  ai_output_json jsonb not null,
  draft_report_text text,
  missing_information_json jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'reviewed', 'approved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table ms.investigation_reports
  add column if not exists generated_by_user_id uuid references auth.users(id) on delete set null,
  add column if not exists generated_at timestamptz not null default now(),
  add column if not exists input_snapshot_json jsonb,
  add column if not exists ai_output_json jsonb,
  add column if not exists draft_report_text text,
  add column if not exists missing_information_json jsonb not null default '[]'::jsonb,
  add column if not exists status text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

update ms.investigation_reports
set status = 'draft'
where status is null or status not in ('draft', 'reviewed', 'approved');

alter table ms.investigation_reports
  alter column status set default 'draft';

alter table ms.investigation_reports
  drop constraint if exists investigation_reports_status_check;

alter table ms.investigation_reports
  add constraint investigation_reports_status_check
  check (status in ('draft', 'reviewed', 'approved'));

create index if not exists idx_investigation_reports_case_id on ms.investigation_reports(case_id);
create index if not exists idx_investigation_reports_generated_at on ms.investigation_reports(generated_at desc);

drop trigger if exists trg_investigation_reports_updated_at on ms.investigation_reports;

create trigger trg_investigation_reports_updated_at
before update on ms.investigation_reports
for each row execute function ms.touch_updated_at();

alter table ms.investigation_reports enable row level security;

grant usage on schema ms to authenticated, service_role;
grant select, insert, update, delete on ms.investigation_reports to authenticated, service_role;

drop policy if exists investigation_reports_read on ms.investigation_reports;
create policy investigation_reports_read on ms.investigation_reports
for select to authenticated
using (
  exists (
    select 1
    from ms.system_maps sm
    where sm.id = investigation_reports.case_id
      and (
        sm.owner_id = auth.uid()
        or exists (
          select 1
          from ms.map_members mm
          where mm.map_id = investigation_reports.case_id
            and mm.user_id = auth.uid()
        )
      )
  )
);

drop policy if exists investigation_reports_write on ms.investigation_reports;
create policy investigation_reports_write on ms.investigation_reports
for insert to authenticated
with check (
  exists (
    select 1
    from ms.system_maps sm
    left join ms.map_members mm on mm.map_id = sm.id and mm.user_id = auth.uid()
    where sm.id = investigation_reports.case_id
      and (sm.owner_id = auth.uid() or mm.role in ('partial_write', 'full_write'))
  )
);

drop policy if exists investigation_reports_creator_update on ms.investigation_reports;
create policy investigation_reports_creator_update on ms.investigation_reports
for update to authenticated
using (generated_by_user_id = auth.uid())
with check (generated_by_user_id = auth.uid());
