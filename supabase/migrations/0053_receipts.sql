-- Receipts app: receipts that need payment, each with an amount and an
-- attached receipt (uploaded file or link), tracked unpaid/paid. Same shape
-- and folder pattern as purchase_order_invoices (0028_purchase_orders.sql),
-- plus an amount column.

create table receipts (
  id text primary key,
  app_id text not null references apps(id) on delete cascade,
  folder text,
  name text not null,
  amount numeric,
  url text,
  is_file boolean,
  file_name text,
  status text not null check (status in ('unpaid', 'paid'))
);
create index receipts_app_id_idx on receipts(app_id);

alter table receipts enable row level security;
create policy "authenticated full access" on receipts
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter publication supabase_realtime add table receipts;

-- 0001_init.sql's apps.builtin check constraint predates this builtin kind.
alter table apps drop constraint apps_builtin_check;
alter table apps add constraint apps_builtin_check
  check (builtin in ('contacts', 'leads', 'announcements', 'tasks', 'timeclock', 'users', 'receivables', 'blog', 'accounts', 'routes', 'respiratory', 'invoices', 'purchaseOrders', 'vehicleInspections', 'equipmentChecklist', 'receipts'));

insert into apps (id, name, type, initial, category, description, icon, tint_bg, tint_fg, builtin, sort_order, unit_label)
values ('receipts', 'Receipts', 'list', 'Rc', 'Finance', 'Receipts that need payment, tracked unpaid/paid', 'receipt', '#FDEFE3', '#C9793A', 'receipts', 23, 'receipts');
