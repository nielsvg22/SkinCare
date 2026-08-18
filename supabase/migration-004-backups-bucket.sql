-- Adds a private storage bucket for automated weekly backups.
-- Only needed if you already ran schema.sql before this.
insert into storage.buckets (id, name, public)
values ('backups', 'backups', false)
on conflict (id) do nothing;

drop policy if exists "users read their own backups" on storage.objects;
create policy "users read their own backups" on storage.objects
  for select using (bucket_id = 'backups' and auth.uid()::text = (storage.foldername(name))[1]);
