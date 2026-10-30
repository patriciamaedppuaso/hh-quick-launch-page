-- H&H's own rep signs the Contractor side of the Hospice agreement, but that
-- signature never changes between contracts -- draw it once in the app and
-- reuse it everywhere via the {{contractor_signature}} token, the same way
-- {{signature}} is reused for the recipient's own drawn signature.

create table if not exists company_signatures (
  id text primary key,
  data_url text not null,
  updated_at timestamptz not null default now()
);

alter table company_signatures enable row level security;

create policy "authenticated full access" on company_signatures
  for all to authenticated using (true) with check (true);

-- readable without auth: the public contract link has to render it too, and
-- a drawn signature image isn't sensitive data.
create policy "anyone can read" on company_signatures
  for select to anon, authenticated using (true);

-- The Contractor (H&H) rep's name/title never change between contracts either,
-- so they're hardcoded directly into the template text rather than fields.
update contract_templates
set body = replace(
  replace(
    replace(
      body,
      'By: ___________________________',
      'By: {{contractor_signature}}'
    ),
    'Name: _________________________',
    'Name: Jacob Clemente'
  ),
  'Title: ________________________',
  'Title: G.M.'
)
where id = 'hospice-equipment-agreement';
