-- Seed data mirroring the app's current DEFAULT_APPS (src/storage.ts) so a
-- fresh Supabase-backed environment starts with the same demo content.
-- Safe to skip/delete this file if you'd rather start with an empty board.

insert into apps (id, name, type, initial, category, description, icon, tint_bg, tint_fg, builtin, sort_order, url, subtitle, use_brand_logo, logo_domain, is_file, file_name, unit_label) values
  ('timeclock', 'Time Clock', 'list', 'TC', 'Attendance', 'Clock in, clock out, and view hours', 'clock', '#FDF1DF', '#C8863A', 'timeclock', 0, null, null, null, null, null, null, 'staff'),
  ('crm', 'CRM', 'link', 'CR', 'Operations', 'Manage clients, patients, and activity', 'briefcase', '#EAF5F4', '#327E88', null, 1, 'https://hhmedicalsupplyportal.com', 'Client system', null, null, null, null, null),
  ('discord', 'Discord', 'link', 'D', 'Communication', 'Team communication and updates', 'message', '#EFECFB', '#7C6FE0', null, 2, 'https://discord.com/app', 'Team workspace', true, null, null, null, null),
  ('quickbooks', 'QuickBooks', 'link', 'QB', 'Finance', 'Invoicing, expenses, and accounting', 'dollar', '#E9F5EF', '#3E9A6D', null, 3, 'https://qbo.intuit.com', 'Accounting portal', true, 'quickbooks.intuit.com', null, null, null),
  ('drive', 'Drive', 'link', 'DR', 'Storage', 'Shared files and folders', 'cloud', '#EAF1FD', '#5B8DEF', null, 4, 'https://drive.google.com', 'Cloud storage', true, null, null, null, null),
  ('contracts-warranty-quotes', 'Contracts, Warranty & Quotes', 'list', 'CW', 'Documents', 'Client contracts and agreements', 'file', '#E7EEF3', '#285677', null, 5, null, null, null, null, null, null, 'folders'),
  ('ringcentral', 'Ring Central', 'link', 'RC', 'Communication', 'Calls, texts, and voicemail', 'phone', '#E7F6F8', '#4FB6C7', null, 6, 'https://app.ringcentral.com', 'Business phone', true, 'ringcentral.com', null, null, null),
  ('task', 'Task', 'list', 'T', 'Productivity', 'Track work and assignments', 'check-square', '#FCF0DC', '#E8A33D', 'tasks', 7, null, null, null, null, null, null, 'tasks'),
  ('announcements', 'Announcements', 'list', 'A', 'Updates', 'Company news and updates', 'megaphone', '#FBEAE6', '#E8836F', 'announcements', 8, null, null, null, null, null, null, 'posts'),
  ('procedures-guidelines', 'Procedures and Guidelines', 'list', 'PG', 'Training', 'SOPs, policies, and staff resources', 'book', '#EEF7F6', '#4E8B8F', null, 9, null, null, null, null, null, null, 'collections'),
  ('contacts', 'Contacts', 'list', 'Co', 'Directory', 'Staff, vendor, and emergency numbers', 'users', '#FAEBF2', '#C77DAE', 'contacts', 10, null, null, null, null, null, null, 'contacts'),
  ('leads', 'Leads', 'list', 'L', 'Sales', 'Prospects and follow-up activity', 'user-plus', '#FBEAED', '#E8748A', 'leads', 11, null, null, null, null, null, null, 'leads');

-- list_items (Contracts/Warranty/Quotes, Procedures & Guidelines)
insert into list_items (id, app_id, name, url, expires_on, updated_at, sort_order) values
  ('cwq-1', 'contracts-warranty-quotes', 'Standard sales contract', '', null, null, 0),
  ('cwq-2', 'contracts-warranty-quotes', 'NDA template', '', null, null, 1),
  ('cwq-3', 'contracts-warranty-quotes', 'Vendor agreement', '', '2026-09-20', '2026-09-12', 2),
  ('cwq-4', 'contracts-warranty-quotes', 'Warranty template', '', '2026-10-05', null, 3),
  ('cwq-5', 'contracts-warranty-quotes', 'Quote template', '', null, null, 4),
  ('pg-1', 'procedures-guidelines', 'Opening checklist', '', null, null, 0),
  ('pg-2', 'procedures-guidelines', 'Customer call script', '', null, null, 1),
  ('pg-3', 'procedures-guidelines', 'Return & refund policy', '', null, null, 2);

-- contacts
insert into contacts (id, app_id, name, role, phone, email) values
  ('contact-1', 'contacts', 'Front Desk', 'Staff', '(555) 010-2200', null),
  ('contact-2', 'contacts', 'MedSupply Vendor', 'Vendor', '(555) 010-8890', 'orders@medsupplyco.com'),
  ('contact-3', 'contacts', 'Building Emergency', 'Emergency', '(555) 010-9111', null);

-- leads
insert into leads (id, app_id, name, company, status, value, follow_up, created_at) values
  ('lead-1', 'leads', 'Dr. Patricia Nguyen', 'Nguyen Family Clinic', 'new', null, null, '2026-09-14'),
  ('lead-2', 'leads', 'Marcus Webb', 'Webb Physical Therapy', 'contacted', null, '2026-09-18', '2026-09-11'),
  ('lead-3', 'leads', 'Riverside Urgent Care', null, 'qualified', 4200, null, '2026-08-20');

-- announcements
insert into announcements (id, app_id, title, message, date, author) values
  ('ann-1', 'announcements', 'New shipment tracking added', 'You can now track outbound shipments directly from the CRM. Reach out if you need a walkthrough.', '2026-09-10', 'Admin'),
  ('ann-2', 'announcements', 'Holiday hours reminder', 'The office will close early on the 24th. Please plan deliveries and pickups accordingly.', '2026-09-05', 'Admin');

-- tasks + assignees
insert into tasks (id, app_id, title, status, due_date, priority) values
  ('task-1', 'task', 'Restock shipping supplies', 'todo', null, 'medium'),
  ('task-2', 'task', 'Follow up on vendor invoice', 'in-progress', '2026-09-10', 'high'),
  ('task-3', 'task', 'Update store opening checklist', 'done', null, 'low');

insert into task_assignees (task_id, assignee_name) values
  ('task-1', 'Myka'),
  ('task-2', 'Front Desk'),
  ('task-3', 'Myka'),
  ('task-3', 'Warehouse Team');

-- time clock: live roster + shift history
insert into clock_records (id, app_id, name, clocked_in, since) values
  ('clock-1', 'timeclock', 'Myka', true, '2026-09-15T07:02:00'),
  ('clock-2', 'timeclock', 'Front Desk', true, '2026-09-15T06:55:00'),
  ('clock-3', 'timeclock', 'Warehouse Team', false, null);

insert into time_entries (id, app_id, name, date, clock_in, clock_out, edit_request_clock_out, edit_request_note, edit_request_requested_at) values
  ('te-1', 'timeclock', 'Myka', '2026-09-13', '2026-09-13T07:05:00', '2026-09-13T15:00:00', '2026-09-13T15:20:00', 'Forgot to clock out on time, stayed late to finish restocking.', '2026-09-13T15:45:00'),
  ('te-2', 'timeclock', 'Myka', '2026-09-14', '2026-09-14T07:00:00', '2026-09-14T15:30:00', null, null, null),
  ('te-3', 'timeclock', 'Myka', '2026-09-15', '2026-09-15T07:02:00', null, null, null, null);

insert into time_entry_breaks (id, time_entry_id, start_at, end_at) values
  ('brk-1', 'te-2', '2026-09-14T11:00:00', '2026-09-14T11:30:00');
