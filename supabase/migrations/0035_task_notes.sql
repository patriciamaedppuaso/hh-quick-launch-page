-- Lets a task carry free-form notes, same as most other builtins already do.
alter table tasks add column notes text;
