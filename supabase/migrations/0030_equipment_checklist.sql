-- Vehicle Equipment Inspection Checklist: a daily per-employee log
-- confirming which medical equipment is loaded before departure from the
-- office. Checklist items are admin-editable (apps.status_options, same
-- pattern as Vehicle Inspection Report's checklist) -- see
-- DEFAULT_EQUIPMENT_CHECKLIST_ITEMS in src/utils.ts for the fallback, and
-- equipment_checklist_items (mirrors task_assignees' composite-key shape)
-- for which items were confirmed present on a given log.

create table equipment_checklists (
  id text primary key,
  app_id text not null references apps(id) on delete cascade,
  employee_name text not null,
  date date not null,
  certified boolean not null default false
);
create index equipment_checklists_app_id_idx on equipment_checklists(app_id);
create index equipment_checklists_date_idx on equipment_checklists(date);

create table equipment_checklist_items (
  checklist_id text not null references equipment_checklists(id) on delete cascade,
  item_name text not null,
  primary key (checklist_id, item_name)
);

alter table equipment_checklists enable row level security;
create policy "authenticated full access" on equipment_checklists
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter table equipment_checklist_items enable row level security;
create policy "authenticated full access" on equipment_checklist_items
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter publication supabase_realtime add table equipment_checklists;
alter publication supabase_realtime add table equipment_checklist_items;

-- 0001_init.sql's apps.builtin check constraint predates this builtin kind.
alter table apps drop constraint apps_builtin_check;
alter table apps add constraint apps_builtin_check
  check (builtin in ('contacts', 'leads', 'announcements', 'tasks', 'timeclock', 'users', 'receivables', 'blog', 'accounts', 'routes', 'respiratory', 'invoices', 'purchaseOrders', 'vehicleInspections', 'equipmentChecklist'));

insert into apps (id, name, type, initial, category, description, icon, tint_bg, tint_fg, builtin, sort_order, unit_label, staff_can_manage, status_options)
values (
  'equipment-checklist',
  'Vehicle Equipment Inspection Checklist',
  'list',
  'EC',
  'Operations',
  'Confirm loaded medical equipment daily before departure from office',
  'check-square',
  '#EAF6F1',
  '#2F9E76',
  'equipmentChecklist',
  21,
  'logs',
  true,
  '["Hospital Bed", "Full / Half Rails", "Hospital Bed Mattress", "APP", "O2 Conc 5L", "Portable System", "Hand Held Nebulizer", "Suction Machine", "Transport Wheelchair", "Shower Chair", "Bedside Commode", "Bedside Table", "Adult Walker", "Mattress Covers (Zip)", "7\" Nasal Cannula", "25\" Nasal Cannula", "50\" Nasal Cannula", "Oxygen Mask", "Humidifier Bottles", "Nebulizer Kit", "Aerosol Mask", "Suction Yanker", "Suction Tubing", "Suction Canister"]'::jsonb
);
