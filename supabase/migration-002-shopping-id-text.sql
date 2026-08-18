-- One-time fix: shopping_items.id must be text (not uuid), since the starter
-- shopping list suggestions use readable ids like "shopping-seed-aftershave".
-- Only needed if you already ran schema.sql before this fix.
alter table public.shopping_items alter column id drop default;
alter table public.shopping_items alter column id type text using id::text;
