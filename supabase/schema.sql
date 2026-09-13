create extension if not exists "pgcrypto";

create table if not exists public.songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null,
  active boolean not null default true,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Safe for existing projects that already created songs without tags.
alter table public.songs
  add column if not exists tags text[] not null default '{}';

create index if not exists songs_tags_gin_idx
  on public.songs using gin (tags);

create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  occasion text not null,
  song_id uuid references public.songs(id) on delete set null,
  song_title text not null,
  artist text not null,
  requester_name text not null,
  dedication text,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected', 'played')),
  created_at timestamptz not null default now()
);

alter table public.songs enable row level security;
alter table public.requests enable row level security;

grant usage on schema public to anon;
grant select on public.songs to anon;
grant insert, select on public.requests to anon;

create policy "Anyone can view active songs"
  on public.songs for select
  to anon
  using (active = true);

create policy "Anyone can submit a song request"
  on public.requests for insert
  to anon
  with check (status = 'pending');

-- The admin dashboard subscribes from the browser with the anon key.
-- For private events, replace this with Supabase Auth and an admin-only policy.
create policy "Dashboard can receive request updates"
  on public.requests for select
  to anon
  using (true);

alter table public.requests replica identity full;
alter publication supabase_realtime add table public.requests;

create index if not exists requests_created_at_idx
  on public.requests (created_at desc);
create index if not exists requests_status_idx
  on public.requests (status);
