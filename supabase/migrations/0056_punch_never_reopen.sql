-- Safety net for the Nov 25, 2026 incident: a tab with a stale copy of the
-- time clock wrote other people's already-closed punches back with
-- end_at = null, re-opening their shifts. The client now writes only the
-- punches it changed, but the database should also refuse to re-open a
-- closed punch no matter which client (or bug) sends it.
--
-- Once end_at is set it can be changed to another time (approved edit
-- requests do this) but never cleared back to null.

create or replace function time_punches_keep_end_at()
returns trigger
language plpgsql
as $$
begin
  if old.end_at is not null and new.end_at is null then
    new.end_at := old.end_at;
  end if;
  return new;
end;
$$;

create trigger time_punches_keep_end_at
  before update on time_punches
  for each row
  execute function time_punches_keep_end_at();
