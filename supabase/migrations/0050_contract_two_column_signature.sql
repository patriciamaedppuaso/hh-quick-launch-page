-- The "Hospice"/"Contractor" signature block was a single justified paragraph
-- with manual space-padding to fake two columns -- text-align: justify
-- collapses that padding, so the columns merged together on screen/PDF. Adds
-- real two-column support (## prefix + " | " per-line separator, parsed by
-- parseParagraph in src/lib/contracts.ts) and switches this block to it.

update contract_templates
set body = replace(
  body,
  $old$"Hospice"                                              "Contractor"

{{name_of_hospice}}                                    Home & Health Medical Supply
a California Corporation                               a California corporation

By: (signed above)                                     By: ___________________________
Name: {{signer_name}}                                  Name: _________________________
Title: {{signer_title}}                                Title: ________________________$old$,
  $new$##"Hospice" | "Contractor"

##{{name_of_hospice}} | Home & Health Medical Supply
a California Corporation | a California corporation

##By: (signed above) | By: ___________________________
Name: {{signer_name}} | Name: _________________________
Title: {{signer_title}} | Title: ________________________$new$
)
where id = 'hospice-equipment-agreement';
