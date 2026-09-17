-- Replace the lead status vocabulary and add a sales rep field.
--
-- Drop the old constraint FIRST -- it doesn't know about the new status
-- values, so the mapping updates below would fail against it (this is what
-- happened the first time: writing 'interested' while the old constraint
-- still only allowed 'new'/'contacted'/'qualified'/'won'/'lost').
alter table leads drop constraint leads_status_check;

update leads set status = 'contacted' where status = 'new';
update leads set status = 'interested' where status = 'qualified';
update leads set status = 'closed' where status = 'won';
update leads set status = 'closed-down' where status = 'lost';

alter table leads add constraint leads_status_check
  check (status in ('contacted', 'follow-up', 'interested', 'schedule-meeting', 'signing-contract', 'closed', 'closed-down'));

alter table leads add column rep text;
