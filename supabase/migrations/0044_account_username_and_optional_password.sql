-- Some shared accounts log in with just a username (no email), and some are
-- shared with the password tracked elsewhere (e.g. SSO) -- so password joins
-- email as optional, and a username field is added alongside it.

alter table account_credentials add column username text;
alter table account_credentials alter column password drop not null;
