-- Lets items inside a "list of items" app (e.g. Procedures & Guidelines,
-- Contracts & Quotes) be organized into folders, managed from inside the app
-- itself. The folder names reuse apps.status_options (the same
-- admin-editable string list used for Leads/Tasks statuses and Contacts
-- categories) -- an app has folders once that list is non-empty, no separate
-- flag needed.
alter table list_items add column folder text;
