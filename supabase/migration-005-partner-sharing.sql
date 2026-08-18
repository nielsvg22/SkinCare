-- Adds optional partner pairing: a combined streak widget and a shareable
-- shopping list between two linked accounts. Only needed if you already
-- ran schema.sql before this.

alter table public.profiles add column if not exists partner_id uuid references public.profiles(id) on delete set null;
alter table public.profiles add column if not exists share_shopping_list boolean not null default false;

drop policy if exists "partner profile is readable" on public.profiles;
create policy "partner profile is readable" on public.profiles
  for select using (auth.uid() = partner_id);

create table if not exists public.partner_invites (
  code text primary key,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

alter table public.partner_invites enable row level security;

drop policy if exists "users manage their own invites" on public.partner_invites;
create policy "users manage their own invites" on public.partner_invites
  for all using (auth.uid() = created_by) with check (auth.uid() = created_by);

drop policy if exists "partner can view products" on public.products;
create policy "partner can view products" on public.products
  for select using (auth.uid() = (select partner_id from public.profiles where id = products.user_id));

drop policy if exists "partner can view daily_logs" on public.daily_logs;
create policy "partner can view daily_logs" on public.daily_logs
  for select using (auth.uid() = (select partner_id from public.profiles where id = daily_logs.user_id));

drop policy if exists "partner can view shared shopping_items" on public.shopping_items;
create policy "partner can view shared shopping_items" on public.shopping_items
  for select using (
    auth.uid() = (
      select partner_id from public.profiles where id = shopping_items.user_id and share_shopping_list
    )
  );

drop policy if exists "partner can toggle shared shopping_items" on public.shopping_items;
create policy "partner can toggle shared shopping_items" on public.shopping_items
  for update using (
    auth.uid() = (
      select partner_id from public.profiles where id = shopping_items.user_id and share_shopping_list
    )
  );
