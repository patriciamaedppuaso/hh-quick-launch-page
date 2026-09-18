-- Receivables & Payables: tracks money owed to us (receivable) and money we
-- owe (payable) in one list, distinguished by `kind`. Status (Unpaid, Paid,
-- ...) is admin-editable per app via apps.status_options, the same pattern
-- used for Leads/Tasks statuses and Contacts categories -- see
-- DEFAULT_RP_STATUSES in src/utils.ts for the fallback.

create table receivables_payables (
  id text primary key,
  app_id text not null references apps(id) on delete cascade,
  kind text not null check (kind in ('receivable', 'payable')),
  party text not null,
  amount numeric not null default 0,
  status text not null,
  due_date date,
  notes text,
  created_at date
);
create index receivables_payables_app_id_idx on receivables_payables(app_id);

alter table receivables_payables enable row level security;
create policy "authenticated full access" on receivables_payables
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter publication supabase_realtime add table receivables_payables;

-- 0001_init.sql's apps.builtin check constraint predates this builtin kind.
alter table apps drop constraint apps_builtin_check;
alter table apps add constraint apps_builtin_check
  check (builtin in ('contacts', 'leads', 'announcements', 'tasks', 'timeclock', 'users', 'receivables'));

insert into apps (id, name, type, initial, category, description, icon, tint_bg, tint_fg, builtin, sort_order, unit_label)
values ('receivables-payables', 'Receivables & Payables', 'list', 'RP', 'Finance', 'Track money owed to us and money we owe', 'dollar', '#FBEAEA', '#B94A4A', 'receivables', 13, 'entries');
