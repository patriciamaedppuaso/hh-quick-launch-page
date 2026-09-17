-- Lets an admin hide an app tile from staff (admins always see every app
-- regardless). See isAppVisible in src/utils.ts.
alter table apps add column visible boolean not null default true;
