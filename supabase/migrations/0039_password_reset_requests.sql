-- Staff who forget their password can't reset it themselves (no SMTP/email
-- flow is configured -- see the note atop supabase/functions/manage-user),
-- so instead they file a request from the login screen that an admin
-- resolves manually with the "reset-password" admin action.
--
-- Unlike every other table, inserts here must work for a logged-out caller
-- (that's the whole point of "forgot password"), so this is the one place
-- we deliberately allow the anon key to write. Reads/updates still require
-- a session -- the UI only exposes those to admins, same trust model as the
-- rest of the admin-only pages.

create table password_reset_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  note text,
  status text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table password_reset_requests enable row level security;
create policy "anyone can file a request" on password_reset_requests
  for insert with check (true);
create policy "authenticated can view requests" on password_reset_requests
  for select using (auth.role() = 'authenticated');
create policy "authenticated can resolve requests" on password_reset_requests
  for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter publication supabase_realtime add table password_reset_requests;
