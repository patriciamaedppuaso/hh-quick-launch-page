-- Ground-up rewrite of the Time Clock data model. Replaces the nested
-- time_entries + time_entry_breaks pair (one row per continuous clock-in/out
-- span, with breaks nested inside and "shift segments" derived client-side
-- by subtracting break spans) with a flat table of independent punches.
-- Each shift and each break is now its own explicitly started/stopped row.
--
-- This directly targets a real production bug: nothing stopped a second
-- time_entries row from opening while one was already open (e.g. a stale
-- browser tab), producing two simultaneously-open shifts and bogus ~24h
-- durations once both got closed with "now". The unique index below
-- enforces "at most one open punch per person" as a real database
-- constraint, not just client-side button state.

create table time_punches (
  id text primary key,
  app_id text not null references apps(id) on delete cascade,
  name text not null,
  date date not null,
  type text not null check (type in ('shift', 'break')),
  start_at timestamptz not null,
  end_at timestamptz,
  edit_request_start timestamptz,
  edit_request_end timestamptz,
  edit_request_note text,
  edit_request_requested_at timestamptz
);

create index time_punches_app_id_idx on time_punches(app_id);
create index time_punches_name_idx on time_punches(name);

-- Core invariant: at most one open punch per (app, person), enforced by
-- Postgres regardless of client-side state.
create unique index time_punches_one_open_per_person
  on time_punches(app_id, name)
  where end_at is null;

alter table time_punches enable row level security;
create policy "authenticated full access" on time_punches
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter publication supabase_realtime add table time_punches;

-- Backfill: convert every existing time_entries + time_entry_breaks row
-- into the new flat punch shape, replicating the current client-side
-- segmentsForEntry() logic (sort an entry's breaks by start, walk them
-- emitting alternating shift/break spans, trailing shift span to
-- clock_out), with one necessary correction: the old data already
-- contains rows that read as "open" more than once for the same person
-- (e.g. two time_entries rows with clock_out null -- the exact
-- double-open-entry bug this rewrite retires; or a single entry whose
-- last break was never closed while the entry itself also reads as
-- open). The new schema makes "more than one open punch per person"
-- impossible even during backfill, so each of those has to be resolved
-- to a single survivor instead of inserted as-is.
--
-- Resolution: for each person, only the chronologically LAST open thing
-- (a trailing shift, or an unclosed break) stays genuinely open (end_at
-- null). Every earlier stale duplicate is force-closed at the instant
-- the next thing in that person's timeline starts -- the next
-- time_entries row's clock_in for a duplicate whole entry, or the next
-- break's start for an earlier unclosed break within one entry. This
-- keeps every synthetic close time real, traceable, and bounded (never
-- "now", never inverted), and visibly correctable afterward via the
-- edit-request flow rather than either crashing this migration or
-- silently producing a second open row.
--
-- For the overwhelming majority of entries (clock_out already set,
-- breaks already closed) this resolution is a no-op -- it only changes
-- behavior for the handful of already-corrupted rows described above.
--
-- A multi-break entry's pending edit request (if any) is attached only to
-- its final/trailing shift punch, since no single punch represents both
-- the old entry's start and end once it's split into several. This only
-- matters for *pending, unreviewed* requests at deploy time, expected to
-- be rare -- if one looks wrong after this runs, just re-submit it.

do $$
declare
  entry record;
  brk record;
  cursor_ts timestamptz;
  last_break_open boolean;
  trailing_end timestamptz;
  seg_count int;
  seg_id text;
begin
  for entry in
    with entry_calc as (
      select
        e.*,
        max(case when clock_out is null then clock_in end) over (partition by name) as max_open_clock_in,
        lead(clock_in) over (partition by name order by clock_in) as next_clock_in
      from time_entries e
    )
    select
      id, app_id, name, date, clock_in,
      case
        when clock_out is not null then clock_out
        when clock_in = max_open_clock_in then null
        else next_clock_in
      end as effective_clock_out,
      edit_request_clock_in, edit_request_clock_out, edit_request_note, edit_request_requested_at
    from entry_calc
    order by id
  loop
    cursor_ts := entry.clock_in;
    last_break_open := false;
    seg_count := 0;

    for brk in
      with break_calc as (
        select
          b.*,
          max(case when end_at is null then start_at end) over () as max_open_start,
          lead(start_at) over (order by start_at) as next_start
        from time_entry_breaks b
        where time_entry_id = entry.id
      )
      select
        id, start_at,
        case
          when end_at is not null then end_at
          when start_at = max_open_start and entry.effective_clock_out is null then null
          when next_start is not null then next_start
          else entry.effective_clock_out
        end as effective_end_at
      from break_calc
      order by start_at asc
    loop
      seg_id := entry.id || '-seg' || seg_count;
      insert into time_punches (id, app_id, name, date, type, start_at, end_at)
      values (seg_id, entry.app_id, entry.name, entry.date, 'shift', cursor_ts, brk.start_at);

      insert into time_punches (id, app_id, name, date, type, start_at, end_at)
      values (brk.id, entry.app_id, entry.name, entry.date, 'break', brk.start_at, brk.effective_end_at);

      cursor_ts := coalesce(brk.effective_end_at, brk.start_at);
      last_break_open := brk.effective_end_at is null;
      seg_count := seg_count + 1;
    end loop;

    -- An unclosed trailing break already is this person's one allowed
    -- open punch -- nothing happened after it, so there's no separate
    -- trailing shift to add (adding one would itself be a second open
    -- punch for the same person).
    if last_break_open and entry.effective_clock_out is null then
      continue;
    end if;

    trailing_end := case
      when entry.effective_clock_out is null then null
      else greatest(entry.effective_clock_out, cursor_ts)
    end;

    seg_id := entry.id || '-seg' || seg_count;
    insert into time_punches (
      id, app_id, name, date, type, start_at, end_at,
      edit_request_start, edit_request_end, edit_request_note, edit_request_requested_at
    )
    values (
      seg_id, entry.app_id, entry.name, entry.date, 'shift', cursor_ts, trailing_end,
      entry.edit_request_clock_in, entry.edit_request_clock_out,
      entry.edit_request_note, entry.edit_request_requested_at
    );
  end loop;
end $$;
