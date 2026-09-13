-- Navii Live schema (multi-tenant)
create extension if not exists "pgcrypto";

create table if not exists public.performers (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  display_name text not null,
  bio text,
  user_id uuid references auth.users(id) on delete cascade unique,
  created_at timestamptz not null default now()
);

create table if not exists public.songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null,
  active boolean not null default true,
  tags text[] not null default '{}',
  performer_id uuid references public.performers(id) on delete cascade,
  created_at timestamptz not null default now()
);

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
  performer_id uuid references public.performers(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists songs_tags_gin_idx on public.songs using gin (tags);
create index if not exists idx_songs_performer on public.songs(performer_id);
create index if not exists idx_requests_performer on public.requests(performer_id);
create index if not exists idx_performers_username on public.performers(username);
create index if not exists requests_created_at_idx on public.requests (created_at desc);
create index if not exists requests_status_idx on public.requests (status);

alter table public.performers enable row level security;
alter table public.songs enable row level security;
alter table public.requests enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.performers to anon, authenticated;
grant select on public.songs to anon, authenticated;
grant insert, select on public.requests to anon, authenticated;
grant insert, update, delete on public.performers to authenticated;
grant insert, update, delete on public.songs to authenticated;
grant update on public.requests to authenticated;

drop policy if exists "performers manage own profile" on public.performers;
create policy "performers manage own profile"
  on public.performers for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "anyone can view performers" on public.performers;
create policy "anyone can view performers"
  on public.performers for select
  using (true);

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

drop policy if exists "Anyone can view active songs" on public.songs;
create policy "Anyone can view active songs"
  on public.songs for select
  to anon
  using (active = true);

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

drop policy if exists "Anyone can submit a song request" on public.requests;
create policy "Anyone can submit a song request"
  on public.requests for insert
  to anon
  with check (status = 'pending');

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

alter table public.requests replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.requests;
exception
  when duplicate_object then null;
end $$;

insert into public.performers (username, display_name, user_id)
values ('navii', 'Navii Live', null)
on conflict (username) do nothing;
