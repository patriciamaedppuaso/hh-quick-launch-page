-- Clears out placeholder/dev-testing accounts and demo content, then
-- reseeds every list-driven app with a small set of clearly-labeled
-- placeholder entries -- just enough to show a new admin/staff member how
-- each app works, not a pretend business dataset. The two generic list
-- apps each get one example folder plus one filed and one unfiled item, to
-- show folders working end to end.

-- ===================================================================
-- Remove placeholder staff accounts, if they were ever created as real
-- logins ("Front Desk" / "Warehouse Team" are generic role names, not
-- individual staff -- deleting the auth user cascades to profiles).
-- ===================================================================
delete from auth.users
where id in (select id from profiles where name in ('Front Desk', 'Warehouse Team'));

-- ===================================================================
-- Wipe timesheet history for every user (fresh start, no leftover
-- dev-testing clock-ins).
-- ===================================================================
delete from time_entries;   -- cascades to time_entry_breaks
delete from clock_records;

-- ===================================================================
-- Clear demo/seed content from every list-driven builtin + generic app.
-- ===================================================================
delete from contacts;
delete from leads;
delete from announcements;  -- cascades to announcement_attachments, read_announcements
delete from tasks;          -- cascades to task_assignees
delete from list_items;
delete from receivables_payables;

-- ===================================================================
-- Contacts -- one example per default category
-- ===================================================================
insert into contacts (id, app_id, name, role, category, phone, email, notes) values
  ('contact-example-1', 'contacts', 'Example Client Contact', 'Decision maker', 'Client', '(555) 000-0001', 'client@example.com', 'Placeholder -- replace with a real client contact.'),
  ('contact-example-2', 'contacts', 'Example Employee Contact', 'Job title', 'Employee', '(555) 000-0002', 'employee@example.com', 'Placeholder -- replace with a real staff contact.'),
  ('contact-example-3', 'contacts', 'Example Vendor Contact', 'Account rep', 'Vendor', '(555) 000-0003', 'vendor@example.com', 'Placeholder -- replace with a real vendor contact.');

-- ===================================================================
-- Leads -- one example showing the status dropdown in use
-- ===================================================================
insert into leads (id, app_id, name, company, status, value, notes, created_at) values
  ('lead-example-1', 'leads', 'Example Lead', 'Example Company', 'Contacted', 1000, 'Placeholder -- replace with a real prospect. Use the status dropdown above to move leads through your pipeline.', current_date);

-- ===================================================================
-- Announcements -- one example explaining what this app is for
-- ===================================================================
insert into announcements (id, app_id, title, message, date, author) values
  ('ann-example-1', 'announcements', 'Example announcement', 'This is a placeholder announcement. Post real updates here -- staff will see them highlighted on the dashboard until they''re read.', current_date, 'Admin');

-- ===================================================================
-- Tasks -- one example per status column
-- ===================================================================
insert into tasks (id, app_id, title, status, priority) values
  ('task-example-1', 'task', 'Example task (To do)', 'To do', 'medium'),
  ('task-example-2', 'task', 'Example task (In progress)', 'In progress', 'medium'),
  ('task-example-3', 'task', 'Example task (Done)', 'Done', 'low');

-- ===================================================================
-- Contracts, Guarantee & Quotes -- one example folder + one filed and
-- one unfiled item
-- ===================================================================
update apps set status_options = '["Example Folder"]'::jsonb
where id = 'contracts-warranty-quotes';

insert into list_items (id, app_id, name, description, url, folder, sort_order) values
  ('cwq-example-1', 'contracts-warranty-quotes', 'Example document (in a folder)', 'Placeholder -- shows how an item looks inside a folder. Replace with a real contract, guarantee, or quote.', '', 'Example Folder', 0),
  ('cwq-example-2', 'contracts-warranty-quotes', 'Example document (no folder)', 'Placeholder -- shows how an item looks when it isn''t filed in any folder.', '', null, 1);

-- ===================================================================
-- Procedures and Guidelines -- one example folder + one filed and one
-- unfiled item
-- ===================================================================
update apps set status_options = '["Example Folder"]'::jsonb
where id = 'procedures-guidelines';

insert into list_items (id, app_id, name, description, url, folder, sort_order) values
  ('pg-example-1', 'procedures-guidelines', 'Example document (in a folder)', 'Placeholder -- shows how an item looks inside a folder. Replace with a real SOP or guideline.', '', 'Example Folder', 0),
  ('pg-example-2', 'procedures-guidelines', 'Example document (no folder)', 'Placeholder -- shows how an item looks when it isn''t filed in any folder.', '', null, 1);

-- ===================================================================
-- Receivables & Payables -- one example of each kind
-- ===================================================================
insert into receivables_payables (id, app_id, kind, party, amount, status, notes, created_at) values
  ('rp-example-1', 'receivables-payables', 'receivable', 'Example Customer', 100.00, 'Unpaid', 'Placeholder -- replace with a real customer balance.', current_date),
  ('rp-example-2', 'receivables-payables', 'payable', 'Example Vendor', 100.00, 'Unpaid', 'Placeholder -- replace with a real vendor balance.', current_date);
