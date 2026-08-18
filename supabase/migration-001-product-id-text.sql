-- One-time fix: products.id must be text (not uuid), since the starter
-- product catalogue uses readable slugs like "boost-shampoo". Only needed if
-- you already ran the original schema.sql before this fix — a fresh
-- schema.sql run doesn't need this.
alter table public.shopping_items drop constraint if exists shopping_items_linked_product_id_fkey;
alter table public.shopping_items alter column linked_product_id type text using linked_product_id::text;

alter table public.products alter column id drop default;
alter table public.products alter column id type text using id::text;

alter table public.shopping_items
  add constraint shopping_items_linked_product_id_fkey
  foreign key (linked_product_id) references public.products(id) on delete set null;
