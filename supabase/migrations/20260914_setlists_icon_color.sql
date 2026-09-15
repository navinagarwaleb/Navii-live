alter table public.setlists
  add column if not exists icon_color text not null default 'sand';
