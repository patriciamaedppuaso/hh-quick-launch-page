-- Leads can now be worked by multiple people at once (a contract often
-- needs more than one rep), so reps become a list -- same composite-key
-- child-table shape as task_assignees -- see src/components/LeadForm.tsx.
-- Existing single-rep data is carried over; the old leads.rep column is
-- left in place (unused going forward) rather than dropped.

create table lead_reps (
  lead_id text not null references leads(id) on delete cascade,
  rep_name text not null,
  primary key (lead_id, rep_name)
);

insert into lead_reps (lead_id, rep_name)
select id, rep from leads where rep is not null and rep <> '';

alter table lead_reps enable row level security;
create policy "authenticated full access" on lead_reps
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter publication supabase_realtime add table lead_reps;
