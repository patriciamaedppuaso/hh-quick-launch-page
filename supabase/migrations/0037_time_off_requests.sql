-- Time Clock: staff can submit shift / break / absence requests, admin
-- approves or denies them -- same shape as the existing time-entry edit
-- request flow (see TimeClockPage.tsx), just its own table since a request
-- doesn't always tie to an existing time entry.

create table time_off_requests (
  id text primary key,
  app_id text not null references apps(id) on delete cascade,
  employee_name text not null,
  type text not null check (type in ('shift', 'break', 'absence')),
  date date not null,
  end_date date,
  start_time text,
  end_time text,
  note text,
  status text not null check (status in ('pending', 'approved', 'denied')) default 'pending',
  requested_at timestamptz not null default now()
);
create index time_off_requests_app_id_idx on time_off_requests(app_id);

alter table time_off_requests enable row level security;
create policy "authenticated full access" on time_off_requests
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter publication supabase_realtime add table time_off_requests;
