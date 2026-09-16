-- Real sign-in now exists (the Login screen), so the "wide open to the anon
-- key" policies from 0001_init.sql and 0003_users.sql are outdated -- they'd
-- let anyone with the (public, shipped-in-the-bundle) anon key read/write
-- everything via the REST API directly, logged in or not. Tighten every
-- table to require an authenticated session instead.
--
-- This does NOT yet distinguish admin vs staff at the database level (that
-- still lives in the `role` column, checked client-side and inside the
-- manage-user Edge Function) -- just "must be signed in at all".

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'apps', 'list_items', 'contacts', 'leads', 'announcements',
      'announcement_attachments', 'read_announcements', 'tasks',
      'task_assignees', 'clock_records', 'time_entries', 'time_entry_breaks',
      'profiles'
    ])
  loop
    execute format('drop policy if exists "anon full access" on %I;', t);
    execute format(
      'create policy "authenticated full access" on %I for all using (auth.role() = ''authenticated'') with check (auth.role() = ''authenticated'');',
      t
    );
  end loop;
end $$;
