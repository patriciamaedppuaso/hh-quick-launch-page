-- 0025 already ran without a starting folder. Seed the "Hospice" folder so
-- it's there before any patients get filed under it.
update apps set status_options = '["Hospice"]'::jsonb
where id = 'respiratory-log';
