-- Clears out placeholder/dev-testing accounts and demo content, then
-- reseeds every list-driven app with fresh, realistic sample data --
-- including folders for the two generic list apps, to show that feature
-- working end to end.

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
-- Contacts
-- ===================================================================
insert into contacts (id, app_id, name, role, category, phone, email) values
  ('contact-1', 'contacts', 'Front Desk Line', 'Main reception', 'Employee', '(555) 010-2200', null),
  ('contact-2', 'contacts', 'Alicia Romero', 'Office Manager', 'Employee', '(555) 010-2201', 'alicia@hhmedicalsupply.com'),
  ('contact-3', 'contacts', 'MedSupply Distributors', 'Primary vendor', 'Vendor', '(555) 010-8890', 'orders@medsupplydist.com'),
  ('contact-4', 'contacts', 'CleanCo Janitorial', 'Facilities vendor', 'Vendor', '(555) 010-7742', 'service@cleancojanitorial.com'),
  ('contact-5', 'contacts', 'Dr. Patricia Nguyen', 'Nguyen Family Clinic', 'Client', '(555) 010-3321', 'p.nguyen@nguyenclinic.com'),
  ('contact-6', 'contacts', 'Building Emergency', '24/7 maintenance', 'Employee', '(555) 010-9111', null);

-- ===================================================================
-- Leads
-- ===================================================================
insert into leads (id, app_id, name, company, status, value, follow_up, notes, created_at, rep) values
  ('lead-1', 'leads', 'Marcus Webb', 'Webb Physical Therapy', 'Contacted', 3200, '2026-10-02', 'Interested in a recurring monthly supply order.', '2026-09-12', 'Myka Tamangan'),
  ('lead-2', 'leads', 'Riverside Urgent Care', null, 'Interested', 4800, '2026-09-28', 'Asked for a formal quote on bulk wound-care supplies.', '2026-09-08', 'Myka Tamangan'),
  ('lead-3', 'leads', 'Dr. Samantha Ortiz', 'Ortiz Family Medicine', 'Schedule Meeting', 1500, '2026-09-25', 'Wants a walkthrough of our catalog next week.', '2026-09-15', 'Myka Tamangan'),
  ('lead-4', 'leads', 'Sunset Hospice Care', null, 'Signing Contract', 6200, null, 'Verbally agreed, waiting on signed paperwork.', '2026-08-30', 'Myka Tamangan'),
  ('lead-5', 'leads', 'Greenview Rehab Center', null, 'Closed', 5400, null, 'Signed an annual supply contract.', '2026-08-10', 'Myka Tamangan');

-- ===================================================================
-- Announcements
-- ===================================================================
insert into announcements (id, app_id, title, message, date, author) values
  ('ann-1', 'announcements', 'New shipment tracking added', 'You can now track outbound shipments directly from the CRM. Reach out if you need a walkthrough.', '2026-09-18', 'Admin'),
  ('ann-2', 'announcements', 'Holiday hours reminder', 'The office will close early on the 24th. Please plan deliveries and pickups accordingly.', '2026-09-10', 'Admin'),
  ('ann-3', 'announcements', 'Updated ordering process for vendors', 'All vendor purchase orders now route through QuickBooks first. See the Procedures app for the updated steps.', '2026-09-05', 'Admin');

-- ===================================================================
-- Tasks
-- ===================================================================
insert into tasks (id, app_id, title, status, due_date, priority) values
  ('task-1', 'task', 'Restock shipping supplies', 'To do', null, 'medium'),
  ('task-2', 'task', 'Follow up on vendor invoice', 'In progress', '2026-09-26', 'high'),
  ('task-3', 'task', 'Update store opening checklist', 'Done', null, 'low'),
  ('task-4', 'task', 'Confirm Q4 catalog pricing with distributors', 'To do', '2026-10-01', 'medium');

insert into task_assignees (task_id, assignee_name) values
  ('task-1', 'Myka Tamangan'),
  ('task-2', 'Myka Tamangan'),
  ('task-4', 'Myka Tamangan');

-- ===================================================================
-- Contracts, Guarantee & Quotes -- list items organized into folders
-- ===================================================================
update apps set status_options = '["Contracts", "Guarantees", "Quotes"]'::jsonb
where id = 'contracts-warranty-quotes';

insert into list_items (id, app_id, name, url, description, expires_on, updated_at, folder, sort_order) values
  ('cwq-1', 'contracts-warranty-quotes', 'Standard sales contract', '', 'Default terms for new customer accounts', null, null, 'Contracts', 0),
  ('cwq-2', 'contracts-warranty-quotes', 'Vendor agreement', '', 'Template for new supplier relationships', '2027-03-20', '2026-09-12', 'Contracts', 1),
  ('cwq-3', 'contracts-warranty-quotes', 'NDA template', '', 'For prospective partners and contractors', null, null, 'Contracts', 2),
  ('cwq-4', 'contracts-warranty-quotes', 'Guarantee template', '', 'Standard product guarantee terms', '2027-01-05', null, 'Guarantees', 0),
  ('cwq-5', 'contracts-warranty-quotes', 'Equipment guarantee - wheelchairs', '', '2-year guarantee terms for mobility equipment', '2027-06-15', null, 'Guarantees', 1),
  ('cwq-6', 'contracts-warranty-quotes', 'Quote template', '', 'Base template for outbound customer quotes', null, null, 'Quotes', 0),
  ('cwq-7', 'contracts-warranty-quotes', 'Bulk order quote - Riverside Urgent Care', '', 'Pending approval', '2026-10-10', '2026-09-15', 'Quotes', 1);

-- ===================================================================
-- Procedures and Guidelines -- list items organized into folders
-- ===================================================================
update apps set status_options = '["Opening & Closing", "Customer Service", "Returns & Refunds"]'::jsonb
where id = 'procedures-guidelines';

insert into list_items (id, app_id, name, url, description, expires_on, updated_at, folder, sort_order) values
  ('pg-1', 'procedures-guidelines', 'Opening checklist', '', 'Steps to open the store each morning', null, null, 'Opening & Closing', 0),
  ('pg-2', 'procedures-guidelines', 'Closing checklist', '', 'Steps to close and lock up each night', null, null, 'Opening & Closing', 1),
  ('pg-3', 'procedures-guidelines', 'Customer call script', '', 'Standard greeting and escalation steps', null, null, 'Customer Service', 0),
  ('pg-4', 'procedures-guidelines', 'Complaint handling guide', '', 'How to de-escalate and log complaints', null, null, 'Customer Service', 1),
  ('pg-5', 'procedures-guidelines', 'Return & refund policy', '', 'Customer-facing return window and conditions', null, null, 'Returns & Refunds', 0),
  ('pg-6', 'procedures-guidelines', 'Warranty claim process', '', 'Internal steps for processing a warranty claim', null, null, 'Returns & Refunds', 1);

-- ===================================================================
-- Receivables & Payables
-- ===================================================================
insert into receivables_payables (id, app_id, kind, party, amount, status, due_date, notes, created_at) values
  ('rp-1', 'receivables-payables', 'receivable', 'Nguyen Family Clinic', 1250.00, 'Unpaid', '2026-10-05', 'Invoice #1042', '2026-09-15'),
  ('rp-2', 'receivables-payables', 'receivable', 'Riverside Urgent Care', 4800.00, 'Partially Paid', '2026-09-30', 'Deposit received, balance due on delivery', '2026-09-10'),
  ('rp-3', 'receivables-payables', 'receivable', 'Greenview Rehab Center', 5400.00, 'Paid', null, 'Annual contract, paid in full', '2026-08-15'),
  ('rp-4', 'receivables-payables', 'payable', 'MedSupply Distributors', 3100.00, 'Unpaid', '2026-09-29', 'Monthly restock order', '2026-09-14'),
  ('rp-5', 'receivables-payables', 'payable', 'CleanCo Janitorial', 450.00, 'Overdue', '2026-09-12', 'Monthly service invoice', '2026-08-30');
