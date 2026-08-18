-- Verzorgingsroutine — Supabase schema
-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query)
-- after creating your project. Safe to re-run (uses IF NOT EXISTS / OR REPLACE).

-- ─────────────────────────────────────────────────────────────
-- Profiles (1:1 with auth.users) — replaces the old "settings"
-- ─────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Jij',
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  morning_time text not null default '07:00',
  evening_time text not null default '22:00',
  default_low_stock_threshold_days integer not null default 21,
  reminders_enabled boolean not null default false,
  onboarded_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles are self-accessible" on public.profiles;
create policy "profiles are self-accessible" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────
-- Products
-- ─────────────────────────────────────────────────────────────
create table if not exists public.products (
  -- text, not uuid: the seed catalogue uses readable slugs (e.g. "boost-shampoo");
  -- user-added products get a crypto.randomUUID() string from the app instead.
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  brand text not null,
  category text not null check (category in ('Haar', 'Lichaam', 'Ogen', 'Gezicht', 'Overig')),
  volume numeric not null,
  unit text not null check (unit in ('ml', 'g', 'stuks')),
  image text not null default '',
  period text not null check (period in ('morning', 'evening', 'both')),
  frequency jsonb not null,
  instructions text not null default '',
  usage_per_application jsonb not null,
  stock jsonb not null,
  purchase_price numeric,
  purchase_url text,
  custom_moment text,
  shave_only boolean not null default false,
  optional boolean not null default false,
  conditional_note text,
  shave_day_note text,
  paused boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

drop policy if exists "products are self-accessible" on public.products;
create policy "products are self-accessible" on public.products
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists products_user_id_idx on public.products(user_id);

-- ─────────────────────────────────────────────────────────────
-- Daily logs (one row per user per day)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  completed_step_ids text[] not null default '{}',
  skipped_step_ids text[] not null default '{}',
  shave_day_enabled boolean not null default false,
  day_paused boolean not null default false,
  unique (user_id, log_date)
);

alter table public.daily_logs enable row level security;

drop policy if exists "daily_logs are self-accessible" on public.daily_logs;
create policy "daily_logs are self-accessible" on public.daily_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists daily_logs_user_id_idx on public.daily_logs(user_id);

-- ─────────────────────────────────────────────────────────────
-- Shopping list
-- ─────────────────────────────────────────────────────────────
create table if not exists public.shopping_items (
  -- text, not uuid: the seed suggestions use readable ids (e.g. "shopping-seed-aftershave").
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  done boolean not null default false,
  linked_product_id text references public.products(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.shopping_items enable row level security;

drop policy if exists "shopping_items are self-accessible" on public.shopping_items;
create policy "shopping_items are self-accessible" on public.shopping_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists shopping_items_user_id_idx on public.shopping_items(user_id);

-- ─────────────────────────────────────────────────────────────
-- Weekly check-ins (logboek)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  hair smallint not null check (hair between 0 and 5),
  skin smallint not null check (skin between 0 and 5),
  eyes smallint not null check (eyes between 0 and 5),
  note text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);

alter table public.check_ins enable row level security;

drop policy if exists "check_ins are self-accessible" on public.check_ins;
create policy "check_ins are self-accessible" on public.check_ins
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists check_ins_user_id_idx on public.check_ins(user_id);

-- ─────────────────────────────────────────────────────────────
-- Progress photos (metadata only — files live in Supabase Storage)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  photo_date date not null,
  category text not null check (category in ('haarlijn', 'haar', 'huid')),
  storage_path text not null,
  note text,
  created_at timestamptz not null default now()
);

alter table public.progress_photos enable row level security;

drop policy if exists "progress_photos are self-accessible" on public.progress_photos;
create policy "progress_photos are self-accessible" on public.progress_photos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists progress_photos_user_id_idx on public.progress_photos(user_id);

-- ─────────────────────────────────────────────────────────────
-- Web Push subscriptions (for the 07:00 ochtendherinnering)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subscriptions are self-accessible" on public.push_subscriptions;
create policy "push_subscriptions are self-accessible" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- No general SELECT policy needed for the cron sender — it uses the
-- service_role key server-side, which bypasses RLS entirely.

-- ─────────────────────────────────────────────────────────────
-- Auto-create a profile row whenever someone signs up
-- ─────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', 'Jij'));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- Storage bucket for product photos & progress photos
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('routine-photos', 'routine-photos', true)
on conflict (id) do nothing;

drop policy if exists "routine-photos are publicly readable" on storage.objects;
create policy "routine-photos are publicly readable" on storage.objects
  for select using (bucket_id = 'routine-photos');

drop policy if exists "users manage their own routine-photos" on storage.objects;
create policy "users manage their own routine-photos" on storage.objects
  for all using (bucket_id = 'routine-photos' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'routine-photos' and auth.uid()::text = (storage.foldername(name))[1]);

-- ─────────────────────────────────────────────────────────────
-- Storage bucket for automated weekly backups (private — the cron writes
-- with the service_role key, which bypasses these policies entirely; users
-- can only read their own folder, never write to it directly)
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('backups', 'backups', false)
on conflict (id) do nothing;

drop policy if exists "users read their own backups" on storage.objects;
create policy "users read their own backups" on storage.objects
  for select using (bucket_id = 'backups' and auth.uid()::text = (storage.foldername(name))[1]);
