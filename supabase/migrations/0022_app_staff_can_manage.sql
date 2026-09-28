-- Lets an admin allow staff (non-admin) to add/edit/delete an app's content
-- (contacts, leads, list items, accounts, ...) instead of just viewing it.
-- Admins can always manage every app regardless of this flag -- see
-- canManage in the various *Page.tsx components.
alter table apps add column staff_can_manage boolean not null default false;
