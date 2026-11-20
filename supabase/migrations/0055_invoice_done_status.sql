-- Printed Invoice: add a third status, "done", alongside the existing
-- "to_be_printed"/"printed" print-tracking states. Kept as its own status
-- value (not merged with the separate `checked` column added in
-- 0045_invoice_checked.sql) because that column is specifically a
-- lightweight "handled" checkbox, not a workflow stage -- "done" is now a
-- full third stage of the same status an invoice otherwise sits in.

alter table printed_invoices drop constraint printed_invoices_status_check;
alter table printed_invoices add constraint printed_invoices_status_check
  check (status in ('printed', 'to_be_printed', 'done'));
