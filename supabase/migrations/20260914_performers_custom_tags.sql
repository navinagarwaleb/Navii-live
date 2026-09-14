-- Performer-level custom tags for song labeling (max 5 enforced in app).
alter table public.performers
  add column if not exists custom_tags text[] not null default '{}';
