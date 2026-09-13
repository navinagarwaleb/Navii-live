-- Ensure authenticated users can insert their own performer row after Google OAuth.
drop policy if exists "performers insert own profile" on public.performers;
drop policy if exists "users can insert own performer row" on public.performers;
create policy "users can insert own performer row"
  on public.performers for insert
  with check (auth.uid() = user_id);
