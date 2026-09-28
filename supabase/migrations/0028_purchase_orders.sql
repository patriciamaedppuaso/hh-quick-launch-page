-- Purchase Orders: invoices (with an attached file or link) grouped into
-- admin-editable folders, same folder pattern as generic list apps via
-- apps.status_options. Uploaded files are stored the same way list_items
-- does it -- as a data URL in the `url` column, no separate storage bucket.

create table purchase_order_invoices (
  id text primary key,
  app_id text not null references apps(id) on delete cascade,
  folder text,
  name text not null,
  url text,
  is_file boolean,
  file_name text,
  status text not null check (status in ('unpaid', 'paid'))
);
create index purchase_order_invoices_app_id_idx on purchase_order_invoices(app_id);

alter table purchase_order_invoices enable row level security;
create policy "authenticated full access" on purchase_order_invoices
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter publication supabase_realtime add table purchase_order_invoices;

-- 0001_init.sql's apps.builtin check constraint predates this builtin kind.
alter table apps drop constraint apps_builtin_check;
alter table apps add constraint apps_builtin_check
  check (builtin in ('contacts', 'leads', 'announcements', 'tasks', 'timeclock', 'users', 'receivables', 'blog', 'accounts', 'routes', 'respiratory', 'invoices', 'purchaseOrders'));

insert into apps (id, name, type, initial, category, description, icon, tint_bg, tint_fg, builtin, sort_order, unit_label)
values ('purchase-orders', 'Purchase Orders', 'list', 'PO', 'Operations', 'Vendor invoices filed by folder, tracked unpaid/paid', 'clipboard', '#EAF1FD', '#4472C4', 'purchaseOrders', 19, 'invoices');
