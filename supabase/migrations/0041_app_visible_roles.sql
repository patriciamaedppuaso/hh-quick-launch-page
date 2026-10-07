-- The "visible to staff / hidden from staff" boolean (0008_app_visibility.sql)
-- is replaced with an explicit list of non-admin roles that can see the app
-- (visible_roles text[]) -- now that "driver" exists alongside "employee",
-- visibility needs to say *which* roles, not just on/off. Admins always see
-- every app regardless, same as before.
--
-- null = visible to everyone (every role); '{}' = hidden from every
-- non-admin role; otherwise the explicit list of roles who can see it.

alter table apps add column visible_roles text[];
update apps set visible_roles = case when visible then null else '{}'::text[] end;
alter table apps drop column visible;
