-- Printed Invoice: a "checked" flag so staff can mark an invoice as
-- verified/handled, independent of its print status (printed /
-- to_be_printed tracks whether it's been printed, not whether it's done).

alter table printed_invoices add column checked boolean not null default false;
