-- User management: a `profiles` table mirrors auth.users with the app-specific
-- fields (name, role) the dashboard needs, kept in sync via triggers so the
-- client (which can't query auth.users directly) has something to read.

-- 0001_init.sql's apps.builtin check constraint predates the "users" builtin
-- kind -- widen it before we try to insert a "users" app row below.
alter table apps drop constraint apps_builtin_check;
alter table apps add constraint apps_builtin_check
  check (builtin in ('contacts', 'leads', 'announcements', 'tasks', 'timeclock', 'users'));

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  role text not null default 'employee' check (role in ('admin', 'employee')),
  created_at timestamptz not null default now(),
  last_sign_in_at timestamptz
);

-- Keep profiles in sync whenever an account is created or its auth state
-- changes (e.g. first sign-in sets last_sign_in_at). Role/name are seeded
-- from the invite's user_metadata on first insert and preserved after that --
-- only email/last_sign_in_at get refreshed on update.
create or replace function public.handle_auth_user_sync()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, role, last_sign_in_at)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    coalesce(new.raw_user_meta_data->>'role', 'employee'),
    new.last_sign_in_at
  )
  on conflict (id) do update
    set email = excluded.email,
        last_sign_in_at = excluded.last_sign_in_at;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_auth_user_sync();

create trigger on_auth_user_updated
  after update on auth.users
  for each row execute function public.handle_auth_user_sync();

-- SECURITY NOTE: same trust model as the rest of this app right now (see the
-- note in 0001_init.sql) -- there's no real auth gate on the dashboard yet,
-- so this stays open to the anon key. Tighten once real sign-in replaces the
-- Admin/Staff toggle.
alter table profiles enable row level security;
create policy "anon full access" on profiles for all using (true) with check (true);

alter publication supabase_realtime add table profiles;

-- Add the "Users" tile to the dashboard's app list.
insert into apps (id, name, type, initial, category, description, icon, tint_bg, tint_fg, builtin, sort_order, unit_label)
values ('users', 'Users', 'list', 'U', 'Administration', 'Manage staff accounts and access', 'users', '#EFEFFB', '#6C63C6', 'users', 12, 'users');
