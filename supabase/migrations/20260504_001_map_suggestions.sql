create table if not exists ms.map_suggestion_runs (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references ms.system_maps(id) on delete cascade,
  overview text not null default '',
  snapshot_hash text,
  generated_by_user_id uuid references auth.users(id) on delete set null,
  is_current boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ms.map_suggestions (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references ms.map_suggestion_runs(id) on delete cascade,
  map_id uuid not null references ms.system_maps(id) on delete cascade,
  suggestion_key text not null,
  title text not null default '',
  question text not null,
  rationale text not null,
  priority text not null check (priority in ('low', 'medium', 'high')),
  category text not null check (
    category in (
      'chronology',
      'evidence',
      'people',
      'factors',
      'controls',
      'outcomes',
      'response',
      'recommendations',
      'relationships',
      'scope',
      'quality',
      'other'
    )
  ),
  dismissed_at timestamptz,
  dismissed_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_map_suggestion_runs_map on ms.map_suggestion_runs(map_id, created_at desc);
create unique index if not exists idx_map_suggestion_runs_current on ms.map_suggestion_runs(map_id) where is_current = true;
create index if not exists idx_map_suggestions_run on ms.map_suggestions(run_id, created_at asc);
create index if not exists idx_map_suggestions_map_active on ms.map_suggestions(map_id, dismissed_at, created_at asc);

create trigger trg_map_suggestion_runs_updated_at
before update on ms.map_suggestion_runs
for each row execute function ms.touch_updated_at();

create trigger trg_map_suggestions_updated_at
before update on ms.map_suggestions
for each row execute function ms.touch_updated_at();

grant select, insert, update, delete on ms.map_suggestion_runs to authenticated;
grant select, insert, update, delete on ms.map_suggestions to authenticated;

alter table ms.map_suggestion_runs enable row level security;
alter table ms.map_suggestions enable row level security;

drop policy if exists map_suggestion_runs_read on ms.map_suggestion_runs;
create policy map_suggestion_runs_read on ms.map_suggestion_runs
for select to authenticated
using (
  exists (
    select 1 from ms.system_maps sm
    where sm.id = map_suggestion_runs.map_id
      and (
        sm.owner_id = auth.uid()
        or exists (
          select 1 from ms.map_members mm
          where mm.map_id = map_suggestion_runs.map_id and mm.user_id = auth.uid()
        )
      )
  )
);

drop policy if exists map_suggestion_runs_write on ms.map_suggestion_runs;
create policy map_suggestion_runs_write on ms.map_suggestion_runs
for all to authenticated
using (
  exists (
    select 1
    from ms.system_maps sm
    left join ms.map_members mm on mm.map_id = sm.id and mm.user_id = auth.uid()
    where sm.id = map_suggestion_runs.map_id
      and (sm.owner_id = auth.uid() or mm.role in ('partial_write', 'full_write'))
  )
)
with check (
  exists (
    select 1
    from ms.system_maps sm
    left join ms.map_members mm on mm.map_id = sm.id and mm.user_id = auth.uid()
    where sm.id = map_suggestion_runs.map_id
      and (sm.owner_id = auth.uid() or mm.role in ('partial_write', 'full_write'))
  )
);

drop policy if exists map_suggestions_read on ms.map_suggestions;
create policy map_suggestions_read on ms.map_suggestions
for select to authenticated
using (
  exists (
    select 1 from ms.system_maps sm
    where sm.id = map_suggestions.map_id
      and (
        sm.owner_id = auth.uid()
        or exists (
          select 1 from ms.map_members mm
          where mm.map_id = map_suggestions.map_id and mm.user_id = auth.uid()
        )
      )
  )
);

drop policy if exists map_suggestions_write on ms.map_suggestions;
create policy map_suggestions_write on ms.map_suggestions
for all to authenticated
using (
  exists (
    select 1
    from ms.system_maps sm
    left join ms.map_members mm on mm.map_id = sm.id and mm.user_id = auth.uid()
    where sm.id = map_suggestions.map_id
      and (sm.owner_id = auth.uid() or mm.role in ('partial_write', 'full_write'))
  )
)
with check (
  exists (
    select 1
    from ms.system_maps sm
    left join ms.map_members mm on mm.map_id = sm.id and mm.user_id = auth.uid()
    where sm.id = map_suggestions.map_id
      and (sm.owner_id = auth.uid() or mm.role in ('partial_write', 'full_write'))
  )
);
