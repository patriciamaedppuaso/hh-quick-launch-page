-- Quick Launch dashboard: fully-normalized schema
-- Mirrors src/types.ts exactly. Run this once in the Supabase SQL Editor
-- (or via `supabase db push` if you're using the CLI).

-- ===================================================================
-- apps: one row per dashboard tile (both "link" and "list" types)
-- ===================================================================
create table apps (
  id text primary key,
  name text not null,
  type text not null check (type in ('link', 'list')),
  initial text not null,
  category text,
  description text,
  icon text,
  tint_bg text,
  tint_fg text,
  builtin text check (builtin in ('contacts', 'leads', 'announcements', 'tasks', 'timeclock')),
  sort_order integer not null default 0,
  -- link-only fields
  url text,
  subtitle text,
  use_brand_logo boolean,
  logo_domain text,
  is_file boolean,
  file_name text,
  -- list-only fields
  unit_label text,
  created_at timestamptz not null default now()
);

-- ===================================================================
-- list_items: generic ListApp.items (Contracts/Warranty/Quotes, Procedures & Guidelines, ...)
-- ===================================================================
create table list_items (
  id text primary key,
  app_id text not null references apps(id) on delete cascade,
  name text not null,
  url text,
  description text,
  is_file boolean,
  file_name text,
  expires_on date,
  updated_at date,
  sort_order integer not null default 0
);
create index list_items_app_id_idx on list_items(app_id);

-- ===================================================================
-- contacts
-- ===================================================================
create table contacts (
  id text primary key,
  app_id text not null references apps(id) on delete cascade,
  name text not null,
  role text,
  phone text,
  email text,
  notes text,
  avatar text
);
create index contacts_app_id_idx on contacts(app_id);

-- ===================================================================
-- leads
-- ===================================================================
create table leads (
  id text primary key,
  app_id text not null references apps(id) on delete cascade,
  name text not null,
  company text,
  status text not null check (status in ('new', 'contacted', 'qualified', 'won', 'lost')),
  value numeric,
  follow_up date,
  notes text,
  created_at date
);
create index leads_app_id_idx on leads(app_id);

-- ===================================================================
-- announcements + attachments
-- ===================================================================
create table announcements (
  id text primary key,
  app_id text not null references apps(id) on delete cascade,
  title text not null,
  message text not null,
  date date not null,
  author text
);
create index announcements_app_id_idx on announcements(app_id);

create table announcement_attachments (
  id text primary key,
  announcement_id text not null references announcements(id) on delete cascade,
  name text not null,
  url text not null,
  is_image boolean not null default false
);
create index announcement_attachments_announcement_id_idx on announcement_attachments(announcement_id);

-- read state is tracked per role (there's no real per-user auth yet -- see README note)
create table read_announcements (
  role text not null check (role in ('admin', 'employee')),
  announcement_id text not null references announcements(id) on delete cascade,
  primary key (role, announcement_id)
);

-- ===================================================================
-- tasks + assignees
-- ===================================================================
create table tasks (
  id text primary key,
  app_id text not null references apps(id) on delete cascade,
  title text not null,
  status text not null check (status in ('todo', 'in-progress', 'done')),
  due_date date,
  priority text check (priority in ('low', 'medium', 'high'))
);
create index tasks_app_id_idx on tasks(app_id);

create table task_assignees (
  task_id text not null references tasks(id) on delete cascade,
  assignee_name text not null,
  primary key (task_id, assignee_name)
);

-- ===================================================================
-- time clock: live roster status + full shift history
-- ===================================================================
create table clock_records (
  id text primary key,
  app_id text not null references apps(id) on delete cascade,
  name text not null,
  clocked_in boolean not null default false,
  since timestamptz
);
create index clock_records_app_id_idx on clock_records(app_id);

create table time_entries (
  id text primary key,
  app_id text not null references apps(id) on delete cascade,
  name text not null,
  date date not null,
  clock_in timestamptz not null,
  clock_out timestamptz,
  edit_request_clock_in timestamptz,
  edit_request_clock_out timestamptz,
  edit_request_note text,
  edit_request_requested_at timestamptz
);
create index time_entries_app_id_idx on time_entries(app_id);
create index time_entries_name_idx on time_entries(name);

create table time_entry_breaks (
  id text primary key,
  time_entry_id text not null references time_entries(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz
);
create index time_entry_breaks_time_entry_id_idx on time_entry_breaks(time_entry_id);

-- ===================================================================
-- Row Level Security
--
-- SECURITY NOTE: this app has no real per-user authentication yet --
-- "Admin" vs "Staff" is a client-side UI toggle, not an enforced
-- permission boundary (see App.tsx). These policies grant the anon
-- key full read/write access, matching that same trust model today.
-- Once real Supabase Auth is added, replace `using (true)` below
-- with checks against auth.uid() / a role claim.
-- ===================================================================
alter table apps enable row level security;
alter table list_items enable row level security;
alter table contacts enable row level security;
alter table leads enable row level security;
alter table announcements enable row level security;
alter table announcement_attachments enable row level security;
alter table read_announcements enable row level security;
alter table tasks enable row level security;
alter table task_assignees enable row level security;
alter table clock_records enable row level security;
alter table time_entries enable row level security;
alter table time_entry_breaks enable row level security;

create policy "anon full access" on apps for all using (true) with check (true);
create policy "anon full access" on list_items for all using (true) with check (true);
create policy "anon full access" on contacts for all using (true) with check (true);
create policy "anon full access" on leads for all using (true) with check (true);
create policy "anon full access" on announcements for all using (true) with check (true);
create policy "anon full access" on announcement_attachments for all using (true) with check (true);
create policy "anon full access" on read_announcements for all using (true) with check (true);
create policy "anon full access" on tasks for all using (true) with check (true);
create policy "anon full access" on task_assignees for all using (true) with check (true);
create policy "anon full access" on clock_records for all using (true) with check (true);
create policy "anon full access" on time_entries for all using (true) with check (true);
create policy "anon full access" on time_entry_breaks for all using (true) with check (true);

-- ===================================================================
-- Realtime: let open browser tabs pick up changes made elsewhere
-- ===================================================================
alter publication supabase_realtime add table apps, list_items, contacts, leads,
  announcements, announcement_attachments, read_announcements, tasks, task_assignees,
  clock_records, time_entries, time_entry_breaks;
