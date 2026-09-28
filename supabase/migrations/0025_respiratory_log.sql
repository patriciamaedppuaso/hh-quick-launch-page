-- Respiratory Log: patients grouped into admin-editable folders (same
-- folder pattern as generic list apps, via apps.status_options), each
-- tracking one or more pieces of loaned equipment with its own ongoing/
-- returned status -- see src/components/RespiratoryLogPage.tsx.

create table respiratory_patients (
  id text primary key,
  app_id text not null references apps(id) on delete cascade,
  folder text,
  patient_name text not null,
  city text,
  due_date date,
  log_date date
);
create index respiratory_patients_app_id_idx on respiratory_patients(app_id);

create table respiratory_equipment (
  id text primary key,
  patient_id text not null references respiratory_patients(id) on delete cascade,
  name text not null,
  status text not null check (status in ('ongoing', 'returned'))
);
create index respiratory_equipment_patient_id_idx on respiratory_equipment(patient_id);

alter table respiratory_patients enable row level security;
create policy "authenticated full access" on respiratory_patients
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter table respiratory_equipment enable row level security;
create policy "authenticated full access" on respiratory_equipment
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter publication supabase_realtime add table respiratory_patients;
alter publication supabase_realtime add table respiratory_equipment;

-- 0001_init.sql's apps.builtin check constraint predates this builtin kind.
alter table apps drop constraint apps_builtin_check;
alter table apps add constraint apps_builtin_check
  check (builtin in ('contacts', 'leads', 'announcements', 'tasks', 'timeclock', 'users', 'receivables', 'blog', 'accounts', 'routes', 'respiratory'));

insert into apps (id, name, type, initial, category, description, icon, tint_bg, tint_fg, builtin, sort_order, unit_label)
values ('respiratory-log', 'Respiratory Log', 'list', 'RL', 'Operations', 'Track respiratory equipment loaned to patients', 'lungs', '#EAF6F1', '#2F9E76', 'respiratory', 17, 'patients');
