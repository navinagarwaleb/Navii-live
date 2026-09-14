alter table public.songs
  add column if not exists artwork_url text;
