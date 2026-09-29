-- Lets each checked-off item on a Daily Routine Stock Log record how many
-- of it are loaded, not just whether it's present -- see ChecklistItemEntry
-- in src/types.ts.
alter table equipment_checklist_items add column quantity integer not null default 1;
