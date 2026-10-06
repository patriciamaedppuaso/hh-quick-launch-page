-- Adds "driver" as a selectable role in Users management. Same permissions
-- as staff everywhere in the app (every role check is just role === 'admin'
-- vs. not) -- this is purely a distinct label/tag for route drivers.
--
-- profiles.role and read_announcements.role both got 'admin'/'employee'
-- check constraints that were never explicitly named (0003_users.sql,
-- 0001_init.sql), so look them up by definition instead of guessing
-- Postgres's auto-generated names.

do $$
declare
  c record;
begin
  for c in
    select conrelid::regclass::text as tbl, conname
    from pg_constraint
    where conrelid in ('public.profiles'::regclass, 'public.read_announcements'::regclass)
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%role%'
  loop
    execute format('alter table %s drop constraint %I', c.tbl, c.conname);
  end loop;
end $$;

alter table profiles add constraint profiles_role_check
  check (role in ('admin', 'employee', 'driver'));
alter table read_announcements add constraint read_announcements_role_check
  check (role in ('admin', 'employee', 'driver'));
