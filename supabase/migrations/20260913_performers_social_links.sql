-- Social links on performers (profile → tips display)
alter table public.performers
  add column if not exists instagram_handle text,
  add column if not exists facebook_url text;
