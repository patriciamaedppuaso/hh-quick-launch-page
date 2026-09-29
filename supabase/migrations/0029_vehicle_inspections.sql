-- Driver's Vehicle Inspection Report: a daily pre-trip/post-trip log per
-- driver/vehicle, with an admin-editable checklist of items a driver can
-- flag as defective (apps.status_options, same pattern as other
-- checklists/folders) -- see DEFAULT_INSPECTION_ITEMS in src/utils.ts for
-- the fallback, and vehicle_inspection_defects (mirrors task_assignees'
-- composite-key shape) for which items were flagged on a given report.

create table vehicle_inspections (
  id text primary key,
  app_id text not null references apps(id) on delete cascade,
  driver_name text not null,
  date date not null,
  trip_type text not null check (trip_type in ('pre_trip', 'post_trip')),
  location text,
  license_plate text,
  vehicle text,
  odometer numeric,
  remarks text,
  condition_acceptable boolean not null default true,
  certified boolean not null default false
);
create index vehicle_inspections_app_id_idx on vehicle_inspections(app_id);
create index vehicle_inspections_date_idx on vehicle_inspections(date);

create table vehicle_inspection_defects (
  inspection_id text not null references vehicle_inspections(id) on delete cascade,
  item_name text not null,
  primary key (inspection_id, item_name)
);

alter table vehicle_inspections enable row level security;
create policy "authenticated full access" on vehicle_inspections
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter table vehicle_inspection_defects enable row level security;
create policy "authenticated full access" on vehicle_inspection_defects
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter publication supabase_realtime add table vehicle_inspections;
alter publication supabase_realtime add table vehicle_inspection_defects;

-- 0001_init.sql's apps.builtin check constraint predates this builtin kind.
alter table apps drop constraint apps_builtin_check;
alter table apps add constraint apps_builtin_check
  check (builtin in ('contacts', 'leads', 'announcements', 'tasks', 'timeclock', 'users', 'receivables', 'blog', 'accounts', 'routes', 'respiratory', 'invoices', 'purchaseOrders', 'vehicleInspections'));

insert into apps (id, name, type, initial, category, description, icon, tint_bg, tint_fg, builtin, sort_order, unit_label, staff_can_manage)
values ('vehicle-inspections', 'Vehicle Inspection Report', 'list', 'VI', 'Operations', 'Daily pre-trip/post-trip vehicle inspection log', 'truck', '#EAF1FD', '#3B6FB6', 'vehicleInspections', 20, 'reports', true);
