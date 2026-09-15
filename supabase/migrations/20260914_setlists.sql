-- Named setlists for performers (gig playlists drawn from their song list).

create table if not exists public.setlists (
  id uuid primary key default gen_random_uuid(),
  performer_id uuid not null references public.performers(id) on delete cascade,
  name text not null,
  icon text not null default 'list-music',
  icon_color text not null default 'sand',
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.setlist_songs (
  id uuid primary key default gen_random_uuid(),
  setlist_id uuid not null references public.setlists(id) on delete cascade,
  song_id uuid not null references public.songs(id) on delete cascade,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (setlist_id, song_id)
);

create index if not exists idx_setlists_performer on public.setlists(performer_id);
create index if not exists idx_setlist_songs_setlist on public.setlist_songs(setlist_id);
create index if not exists idx_setlist_songs_song on public.setlist_songs(song_id);

alter table public.setlists enable row level security;
alter table public.setlist_songs enable row level security;

grant select on public.setlists to anon, authenticated;
grant select on public.setlist_songs to anon, authenticated;
grant insert, update, delete on public.setlists to authenticated;
grant insert, update, delete on public.setlist_songs to authenticated;

drop policy if exists "performers manage own setlists" on public.setlists;
create policy "performers manage own setlists"
  on public.setlists for all
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

drop policy if exists "anyone can read setlists" on public.setlists;
create policy "anyone can read setlists"
  on public.setlists for select
  using (true);

drop policy if exists "performers manage own setlist songs" on public.setlist_songs;
create policy "performers manage own setlist songs"
  on public.setlist_songs for all
  using (
    exists (
      select 1
      from public.setlists s
      join public.performers p on p.id = s.performer_id
      where s.id = setlist_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.setlists s
      join public.performers p on p.id = s.performer_id
      join public.songs song on song.id = song_id
      where s.id = setlist_id
        and p.user_id = auth.uid()
        and song.performer_id = s.performer_id
    )
  );

drop policy if exists "anyone can read setlist songs" on public.setlist_songs;
create policy "anyone can read setlist songs"
  on public.setlist_songs for select
  using (true);
