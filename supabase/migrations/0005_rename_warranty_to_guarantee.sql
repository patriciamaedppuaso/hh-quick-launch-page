-- Rename "Warranty" to "Guarantee" in the Contracts app and its template item.
-- The app's internal id/slug is left unchanged (not user-visible).

update apps
set name = 'Contracts, Guarantee & Quotes'
where id = 'contracts-warranty-quotes';

update list_items
set name = 'Guarantee template'
where id = 'cwq-4';
