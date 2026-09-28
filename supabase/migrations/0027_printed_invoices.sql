-- Printed Invoice: invoices grouped into admin-editable folders (same
-- folder pattern as Respiratory Log / generic list apps, via
-- apps.status_options). Order type and status are fixed sets (not
-- admin-editable) -- see ORDER_TYPES in src/utils.ts and InvoiceStatus in
-- src/types.ts.

create table printed_invoices (
  id text primary key,
  app_id text not null references apps(id) on delete cascade,
  folder text,
  patient_name text not null,
  address text,
  hospice text,
  order_type text not null check (order_type in ('Delivery', 'Pickup', 'Swapout', 'Sale', 'Service')),
  notes text,
  status text not null check (status in ('printed', 'to_be_printed')),
  date date not null
);
create index printed_invoices_app_id_idx on printed_invoices(app_id);
create index printed_invoices_date_idx on printed_invoices(date);

alter table printed_invoices enable row level security;
create policy "authenticated full access" on printed_invoices
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter publication supabase_realtime add table printed_invoices;

-- 0001_init.sql's apps.builtin check constraint predates this builtin kind.
alter table apps drop constraint apps_builtin_check;
alter table apps add constraint apps_builtin_check
  check (builtin in ('contacts', 'leads', 'announcements', 'tasks', 'timeclock', 'users', 'receivables', 'blog', 'accounts', 'routes', 'respiratory', 'invoices'));

insert into apps (id, name, type, initial, category, description, icon, tint_bg, tint_fg, builtin, sort_order, unit_label)
values ('printed-invoice', 'Printed Invoice', 'list', 'PI', 'Operations', 'Track invoices by order type and print status', 'receipt', '#FDF2E3', '#C98A2E', 'invoices', 18, 'invoices');
