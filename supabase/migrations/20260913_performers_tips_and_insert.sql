-- Tip / Interac settings on performers (profile, not onboarding)
alter table public.performers
  add column if not exists tip_handle text,
  add column if not exists interac_email text;

-- Allow authenticated users to insert their own performer row (OAuth setup)
drop policy if exists "performers insert own profile" on public.performers;
drop policy if exists "users can insert own performer row" on public.performers;
create policy "users can insert own performer row"
  on public.performers for insert
  with check (auth.uid() = user_id);
