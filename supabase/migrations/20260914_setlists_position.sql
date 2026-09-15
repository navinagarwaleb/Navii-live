-- Ordered setlists per performer (drag-to-reorder like setlist songs).

alter table public.setlists
  add column if not exists position integer not null default 0;

with ordered as (
  select
    id,
    (row_number() over (
      partition by performer_id
      order by updated_at desc, created_at desc
    ) - 1)::integer as pos
  from public.setlists
)
update public.setlists s
set position = ordered.pos
from ordered
where s.id = ordered.id;

create index if not exists idx_setlists_performer_position
  on public.setlists (performer_id, position);
