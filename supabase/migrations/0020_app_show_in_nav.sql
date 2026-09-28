-- Lets an admin pin any app (including link-type ones, which never showed
-- in the sidebar before) into the nav, or remove a list app from the nav
-- without deleting it. Null = default behavior (list apps show, link apps
-- don't) -- see isAppVisible/Sidebar in the app.
alter table apps add column show_in_nav boolean;
