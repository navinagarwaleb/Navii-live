-- Add optional bio/tagline to performers
alter table public.performers
  add column if not exists bio text;

update public.performers
set bio = coalesce(bio, 'Request a song and make your moment unforgettable.')
where username = 'navii' and (bio is null or bio = '');
