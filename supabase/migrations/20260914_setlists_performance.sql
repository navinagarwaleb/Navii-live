-- Live performance mode: one active setlist per performer; per-song performed flags.

alter table public.setlists
  add column if not exists is_performing boolean not null default false;

alter table public.setlist_songs
  add column if not exists performed boolean not null default false;

-- At most one performing setlist per performer.
create unique index if not exists idx_setlists_one_performing
  on public.setlists (performer_id)
  where is_performing = true;
