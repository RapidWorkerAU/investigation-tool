alter table ms.investigation_reports
  add column if not exists version_number integer;

with ranked_reports as (
  select
    id,
    row_number() over (
      partition by case_id
      order by generated_at asc, created_at asc, id asc
    ) as next_version_number
  from ms.investigation_reports
)
update ms.investigation_reports as report
set version_number = ranked_reports.next_version_number
from ranked_reports
where ranked_reports.id = report.id
  and (
    report.version_number is null
    or report.version_number <> ranked_reports.next_version_number
  );

alter table ms.investigation_reports
  alter column version_number set not null;

create unique index if not exists idx_investigation_reports_case_version
  on ms.investigation_reports(case_id, version_number);

drop policy if exists investigation_reports_creator_update on ms.investigation_reports;

drop policy if exists investigation_reports_manage on ms.investigation_reports;
create policy investigation_reports_manage on ms.investigation_reports
for update to authenticated
using (
  exists (
    select 1
    from ms.system_maps sm
    left join ms.map_members mm on mm.map_id = sm.id and mm.user_id = auth.uid()
    where sm.id = investigation_reports.case_id
      and (sm.owner_id = auth.uid() or mm.role in ('partial_write', 'full_write'))
  )
)
with check (
  exists (
    select 1
    from ms.system_maps sm
    left join ms.map_members mm on mm.map_id = sm.id and mm.user_id = auth.uid()
    where sm.id = investigation_reports.case_id
      and (sm.owner_id = auth.uid() or mm.role in ('partial_write', 'full_write'))
  )
);

drop policy if exists investigation_reports_delete on ms.investigation_reports;
create policy investigation_reports_delete on ms.investigation_reports
for delete to authenticated
using (
  exists (
    select 1
    from ms.system_maps sm
    left join ms.map_members mm on mm.map_id = sm.id and mm.user_id = auth.uid()
    where sm.id = investigation_reports.case_id
      and (sm.owner_id = auth.uid() or mm.role in ('partial_write', 'full_write'))
  )
);
