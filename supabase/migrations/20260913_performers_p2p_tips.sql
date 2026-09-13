-- P2P tip handles on performers (app "profiles")
alter table public.performers
  add column if not exists paypal_me_link text,
  add column if not exists venmo_handle text,
  add column if not exists cash_app_handle text;

-- Migrate legacy paypal_link when present
update public.performers
set paypal_me_link = paypal_link
where paypal_me_link is null
  and paypal_link is not null
  and paypal_link <> '';
