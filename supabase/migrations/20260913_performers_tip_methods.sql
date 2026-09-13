-- Tip payment methods on performers
alter table public.performers
  add column if not exists paypal_link text,
  add column if not exists custom_tip_link text;

-- Carry over legacy tip_handle into custom_tip_link when empty
update public.performers
set custom_tip_link = tip_handle
where custom_tip_link is null
  and tip_handle is not null
  and tip_handle <> '';
