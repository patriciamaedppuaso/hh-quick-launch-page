-- Every file upload in this app (item attachments, purchase order invoices,
-- app logos, announcement attachments, avatars) has been stored as an inline
-- base64 data: URI directly in a Postgres text column. That doesn't scale --
-- large files bloat every full-table fetch, and can be big enough that
-- Supabase Realtime's change-notification payload fails to deliver, leaving
-- other open sessions stale until a manual refresh (reported as "my
-- coworker can't see the file I added," though the data was there all
-- along). Switching to a real Storage bucket fixes both.
--
-- Public bucket + public read policy: this mirrors the app's existing trust
-- model (no per-user ACLs anywhere -- see the security notes in
-- 0001_init.sql / 0004_require_auth.sql), so there's no finer-grained access
-- to enforce here. Only signed-in users can write.

insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

create policy "authenticated can upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'uploads');

create policy "authenticated can update uploads" on storage.objects
  for update to authenticated
  using (bucket_id = 'uploads')
  with check (bucket_id = 'uploads');

create policy "authenticated can delete uploads" on storage.objects
  for delete to authenticated
  using (bucket_id = 'uploads');

create policy "anyone can read uploads" on storage.objects
  for select
  using (bucket_id = 'uploads');
