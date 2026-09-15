alter table public.setlists
  add column if not exists icon text not null default 'list-music';
