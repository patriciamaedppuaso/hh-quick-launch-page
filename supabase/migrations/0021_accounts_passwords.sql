-- Accounts & Passwords: a shared vault of service logins (email + password)
-- for the team, e.g. shared software/vendor accounts. Category is
-- admin-editable per app via apps.status_options, the same pattern used for
-- Contacts categories -- see DEFAULT_ACCOUNT_CATEGORIES in src/utils.ts for
-- the fallback.

create table account_credentials (
  id text primary key,
  app_id text not null references apps(id) on delete cascade,
  name text not null,
  category text,
  email text not null,
  password text not null,
  url text,
  notes text,
  updated_at date
);
create index account_credentials_app_id_idx on account_credentials(app_id);

alter table account_credentials enable row level security;
create policy "authenticated full access" on account_credentials
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter publication supabase_realtime add table account_credentials;

-- 0001_init.sql's apps.builtin check constraint predates this builtin kind.
alter table apps drop constraint apps_builtin_check;
alter table apps add constraint apps_builtin_check
  check (builtin in ('contacts', 'leads', 'announcements', 'tasks', 'timeclock', 'users', 'receivables', 'blog', 'accounts'));

insert into apps (id, name, type, initial, category, description, icon, tint_bg, tint_fg, builtin, sort_order, unit_label)
values ('accounts-passwords', 'Accounts & Passwords', 'list', 'AP', 'Admin', 'Shared logins for team accounts', 'key', '#EFECFB', '#7C6FE0', 'accounts', 15, 'accounts');
