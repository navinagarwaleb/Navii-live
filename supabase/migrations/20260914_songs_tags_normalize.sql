-- Ensure tags column exists and normalize existing values (lowercase / trim / dedupe).
alter table public.songs
  add column if not exists tags text[] not null default '{}';

update public.songs
set tags = coalesce(
  (
    select array_agg(distinct lower(trim(t)) order by lower(trim(t)))
    from unnest(tags) as t
    where trim(t) <> ''
  ),
  '{}'::text[]
);

create index if not exists songs_tags_gin_idx on public.songs using gin (tags);
