-- Tasks now track a created date, editable like Leads already does -- and
-- the Calendar view in TasksPage.tsx plots tasks by this date instead of
-- due date, since not every task has a due date but every task has one of
-- these. Existing tasks backfill to today so they still show up somewhere.
alter table tasks add column created_at date;
update tasks set created_at = current_date where created_at is null;
