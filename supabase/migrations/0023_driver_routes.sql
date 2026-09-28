-- Driver's Routes: each driver's daily stop list (pickup/delivery visits,
-- plus non-customer entries like office/gas/lunch). Drivers are an
-- admin-editable list per app via apps.status_options, same pattern as
-- Leads/Tasks statuses and Contacts categories. Staff can log their own
-- routes by default (staff_can_manage = true below) -- see canManageApp in
-- src/utils.ts.

create table route_stops (
  id text primary key,
  app_id text not null references apps(id) on delete cascade,
  driver text not null,
  date date not null,
  start_time text,
  end_time text,
  mileage numeric,
  customer_name text not null,
  street text,
  city text,
  driver_eta text,
  schedule_eta text,
  service_performed text,
  note text,
  flagged boolean not null default false
);
create index route_stops_app_id_idx on route_stops(app_id);
create index route_stops_driver_date_idx on route_stops(driver, date);

alter table route_stops enable row level security;
create policy "authenticated full access" on route_stops
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter publication supabase_realtime add table route_stops;

-- 0001_init.sql's apps.builtin check constraint predates this builtin kind.
alter table apps drop constraint apps_builtin_check;
alter table apps add constraint apps_builtin_check
  check (builtin in ('contacts', 'leads', 'announcements', 'tasks', 'timeclock', 'users', 'receivables', 'blog', 'accounts', 'routes'));

insert into apps (id, name, type, initial, category, description, icon, tint_bg, tint_fg, builtin, sort_order, unit_label, staff_can_manage)
values ('driver-routes', 'Driver''s Routes', 'list', 'DR', 'Operations', 'Daily pickup/delivery stops by driver', 'truck', '#E8F3EA', '#3F9142', 'routes', 16, 'stops', true);
