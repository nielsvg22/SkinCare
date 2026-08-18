-- Adds columns for: herbevoorraad-link, eigen routine-momenten, vakantie/pauzestand.
-- Only needed if you already ran schema.sql before this — a fresh schema.sql
-- run doesn't need this.
alter table public.products add column if not exists purchase_url text;
alter table public.products add column if not exists custom_moment text;
alter table public.daily_logs add column if not exists day_paused boolean not null default false;
