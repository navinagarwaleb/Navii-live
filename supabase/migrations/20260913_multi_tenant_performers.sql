-- Multi-tenant performers migration for Navii Live
-- Run in Supabase SQL Editor.

create extension if not exists "pgcrypto";

-- 1. Performers
create table if not exists public.performers (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  display_name text not null,
  user_id uuid references auth.users(id) on delete cascade unique,
  created_at timestamptz not null default now()
);

alter table public.performers
  add column if not exists bio text;

alter table public.performers enable row level security;

drop policy if exists "performers manage own profile" on public.performers;
create policy "performers manage own profile"
  on public.performers for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "anyone can view performers" on public.performers;
create policy "anyone can view performers"
  on public.performers for select
  using (true);

grant select on public.performers to anon, authenticated;
grant insert, update, delete on public.performers to authenticated;

-- 2. Songs → performers
alter table public.songs
  add column if not exists performer_id uuid references public.performers(id) on delete cascade;

drop policy if exists "performers manage own songs" on public.songs;
create policy "performers manage own songs"
  on public.songs for all
  using (
    performer_id in (
      select id from public.performers where user_id = auth.uid()
    )
  )
  with check (
    performer_id in (
      select id from public.performers where user_id = auth.uid()
    )
  );

drop policy if exists "anyone can read songs" on public.songs;
create policy "anyone can read songs"
  on public.songs for select
  using (true);

-- Keep legacy active-song read policy if present (harmless OR with above).
-- Prefer public reads of all rows; app still filters active = true.

-- 3. Requests → performers
alter table public.requests
  add column if not exists performer_id uuid references public.performers(id) on delete cascade;

drop policy if exists "performers view own requests" on public.requests;
create policy "performers view own requests"
  on public.requests for select
  using (
    performer_id in (
      select id from public.performers where user_id = auth.uid()
    )
  );

drop policy if exists "anyone can submit requests" on public.requests;
create policy "anyone can submit requests"
  on public.requests for insert
  with check (true);

-- Tighten legacy open dashboard select (admin uses service role / API instead).
drop policy if exists "Dashboard can receive request updates" on public.requests;

-- Performers can update status on their own requests (future auth admin UI).
drop policy if exists "performers update own requests" on public.requests;
create policy "performers update own requests"
  on public.requests for update
  using (
    performer_id in (
      select id from public.performers where user_id = auth.uid()
    )
  )
  with check (
    performer_id in (
      select id from public.performers where user_id = auth.uid()
    )
  );

-- 4. Indexes
create index if not exists idx_songs_performer on public.songs(performer_id);
create index if not exists idx_requests_performer on public.requests(performer_id);
create index if not exists idx_performers_username on public.performers(username);

-- 5. Bootstrap default performer + backfill existing rows
insert into public.performers (username, display_name, user_id)
values ('navii', 'Navii Live', null)
on conflict (username) do nothing;

update public.songs s
set performer_id = p.id
from public.performers p
where p.username = 'navii'
  and s.performer_id is null;

update public.requests r
set performer_id = p.id
from public.performers p
where p.username = 'navii'
  and r.performer_id is null;
