-- Lets admins customize the status tabs shown beside the search bar in Leads
-- and Tasks (add/remove options) instead of a fixed hardcoded list. See
-- DEFAULT_LEAD_STATUSES / DEFAULT_TASK_STATUSES / DONE_STATUS in src/utils.ts
-- for the fallback used when an app has no status_options set yet.
alter table apps add column status_options jsonb;

-- Leads: status becomes free text managed per app, so the fixed CHECK list
-- no longer applies. Existing rows are remapped to the new human-readable
-- labels (these also become the default status_options for any leads app).
alter table leads drop constraint leads_status_check;

update leads set status = 'Contacted' where status = 'contacted';
update leads set status = 'Follow Up' where status = 'follow-up';
update leads set status = 'Interested' where status = 'interested';
update leads set status = 'Schedule Meeting' where status = 'schedule-meeting';
update leads set status = 'Signing Contract' where status = 'signing-contract';
update leads set status = 'Closed' where status = 'closed';
update leads set status = 'Closed Down' where status = 'closed-down';

-- Tasks: "Done" stays a fixed, protected status (overdue/strikethrough logic
-- depends on it); the rest become free text / admin-editable.
alter table tasks drop constraint tasks_status_check;

update tasks set status = 'To do' where status = 'todo';
update tasks set status = 'In progress' where status = 'in-progress';
update tasks set status = 'Done' where status = 'done';
