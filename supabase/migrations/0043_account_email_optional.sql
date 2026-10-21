-- Not every shared account has a dedicated email (e.g. a shared login tied
-- to a username, or a phone-based account) -- email joins url/notes as an
-- optional field. Password stays required.

alter table account_credentials alter column email drop not null;
