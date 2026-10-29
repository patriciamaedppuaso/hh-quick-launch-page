-- Service Contracts: staff generate a blank contract and share its link; the
-- recipient opens the link (no login), fills in their info, signs, and
-- submits. This is the first place in the app that needs to serve data to a
-- signed-out visitor, so unlike every other table here, direct anon access
-- to the table is NOT granted -- that would let anyone list every contract
-- (names, addresses, signatures) via the REST API. Instead, two
-- security-definer functions do the lookup/update by share_token, so the
-- token itself (unguessable, 32 random bytes) is what gates access -- same
-- "capability link" pattern as the rest of this feature.

create table contract_templates (
  id text primary key default 'default',
  title text not null,
  body text not null,
  updated_at timestamptz not null default now()
);

create table service_contracts (
  id text primary key,
  share_token text not null unique,
  internal_label text,
  status text not null default 'pending' check (status in ('pending', 'completed')),
  full_name text,
  address text,
  phone text,
  email text,
  equipment text,
  start_date date,
  agreed boolean,
  signature_data_url text,
  signed_at timestamptz,
  created_at timestamptz not null default now(),
  created_by text
);
create index service_contracts_share_token_idx on service_contracts(share_token);

alter table contract_templates enable row level security;
create policy "authenticated full access" on contract_templates
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
-- the template is just boilerplate contract text, not sensitive -- the
-- public fill-out page needs to read it before anyone has signed in.
create policy "anyone can read the template" on contract_templates
  for select using (true);

alter table service_contracts enable row level security;
create policy "authenticated full access" on service_contracts
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter publication supabase_realtime add table contract_templates;
alter publication supabase_realtime add table service_contracts;

-- Looks up a contract by its share token. security definer so it can read
-- the row without a blanket anon select policy on the table.
create or replace function get_contract_by_token(p_token text)
returns service_contracts
language sql
security definer
set search_path = public
as $$
  select * from service_contracts where share_token = p_token;
$$;
grant execute on function get_contract_by_token(text) to anon, authenticated;

-- Fills in and signs a pending contract by its share token. Only ever
-- transitions pending -> completed, and only once (re-submits are rejected)
-- so a link can't be used to silently overwrite an already-signed contract.
create or replace function submit_contract(
  p_token text,
  p_full_name text,
  p_address text,
  p_phone text,
  p_email text,
  p_equipment text,
  p_start_date date,
  p_agreed boolean,
  p_signature_data_url text
)
returns service_contracts
language plpgsql
security definer
set search_path = public
as $$
declare
  result service_contracts;
begin
  update service_contracts
  set full_name = p_full_name,
      address = p_address,
      phone = p_phone,
      email = p_email,
      equipment = p_equipment,
      start_date = p_start_date,
      agreed = p_agreed,
      signature_data_url = p_signature_data_url,
      status = 'completed',
      signed_at = now()
  where share_token = p_token and status = 'pending'
  returning * into result;

  if result.id is null then
    raise exception 'This contract link is invalid or has already been submitted.';
  end if;

  return result;
end;
$$;
grant execute on function submit_contract(text, text, text, text, text, text, date, boolean, text) to anon, authenticated;

insert into contract_templates (id, title, body) values (
  'default',
  'Equipment Rental & Service Agreement',
  E'PLACEHOLDER TEXT -- replace this with H&H Medical Supply''s reviewed contract language before sending this to a real customer.\n\nThis agreement is between H&H Medical Supply (\"Provider\") and the undersigned (\"Customer\") for the rental and/or servicing of the medical equipment described below.\n\n1. The Customer agrees to use the equipment only as directed and to report any malfunction promptly.\n2. The Customer is responsible for the equipment while in their possession and agrees to return it in good condition.\n3. Provider will perform routine maintenance as scheduled.\n\nBy signing below, the Customer acknowledges they have read and agree to the terms above.'
);

-- This lives as a tab inside the existing "Contracts, Guarantee & Quotes"
-- app (contracts-warranty-quotes) rather than its own sidebar app -- see
-- ItemsPage.tsx -- so no new apps row or builtin kind is needed.
