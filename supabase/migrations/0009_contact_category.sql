-- Lets contacts be classified (Client, Employee, Vendor, ...). The set of
-- categories is admin-editable per app, reusing apps.status_options the same
-- way Leads/Tasks statuses do -- see DEFAULT_CONTACT_CATEGORIES in
-- src/utils.ts for the fallback used when a contacts app has none set yet.
alter table contacts add column category text;
