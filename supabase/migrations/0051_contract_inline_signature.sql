-- Embeds the actual drawn signature image into the document body itself,
-- instead of only showing it in a separate signature pad below the page.
-- {{signature}} is a reserved token (not a regular field) recognized by
-- renderInline in PublicContractPage.tsx: it renders the live/stored
-- signature image inline, or a blank line if nothing is signed yet.

update contract_templates
set body = replace(
  body,
  '##By: (signed above) | By: ___________________________',
  '##By: {{signature}} | By: ___________________________'
)
where id = 'hospice-equipment-agreement';

update contract_templates
set body = replace(
  body,
  '**Print Name:** {{name_of_guarantor}}',
  '**Signature:** {{signature}}' || chr(10) || '**Print Name:** {{name_of_guarantor}}'
)
where id = 'guaranty-agreement';
