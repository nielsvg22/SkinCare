-- Fixes a real bug: every new signup was getting the starter product
-- catalogue AND starter shopping list seeded twice (10 products instead of
-- 5), because the old "seed if the table is empty" check isn't safe against
-- overlapping calls (multiple Supabase auth-state events can fire for a
-- single sign-in, and each one independently saw zero rows and inserted).
--
-- This adds an atomic claim flag: seeding only proceeds for whichever caller
-- actually flips has_seeded from false to true, so it can only ever happen
-- once per account no matter how many overlapping calls occur.
--
-- All EXISTING accounts already have their real product data, so they're
-- marked as already-seeded here to avoid re-seeding them on next login.
alter table public.profiles add column if not exists has_seeded boolean not null default false;
update public.profiles set has_seeded = true where has_seeded = false;
