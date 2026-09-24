-- hh_categories: product categories for the hhmedicalsupply.com catalog.
-- id is text (not uuid) on purpose -- see 0015: app code generates ids as
-- plain strings, and a uuid column rejects those. Existing uuid values are
-- valid text, so the seed rows below are unaffected.

create table hh_categories (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  slug text not null unique,
  description text,
  icon_name text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index hh_categories_sort_order_idx on hh_categories(sort_order);

alter table hh_categories enable row level security;
create policy "authenticated full access" on hh_categories
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- hh_categories (9 rows)
insert into hh_categories (id, name, slug, description, icon_name, sort_order, is_active, created_at, updated_at) values
  ('6d399590-6fec-4522-ba92-ebe9d21c9e36', 'Bedroom', 'bedroom', 'Hospital beds, patient lifts, and bedroom care.', 'BedroomIcon', 0, true, '2026-07-16 22:22:46.887352+00', '2026-07-16 22:22:46.887352+00'),
  ('c383e971-699b-4c7c-8e8f-dff7b4a7b565', 'Bathroom', 'bathroom', 'Shower chairs, commodes, and grab bars.', 'BathSafetyIcon', 10, true, '2026-07-16 22:22:46.887352+00', '2026-07-16 22:22:46.887352+00'),
  ('2102bbf7-b967-4a84-9af7-88b92b445690', 'Incontinence', 'incontinence', 'Briefs, underpads, and personal hygiene.', 'IncontinenceIcon', 20, true, '2026-07-16 22:22:46.887352+00', '2026-07-16 22:22:46.887352+00'),
  ('7da64283-cc1f-4bec-910d-80ce5346f91d', 'Mobility Aids', 'mobility-aids', 'Rollators, walkers, and canes.', 'MobilityIcon', 30, true, '2026-07-16 22:22:46.887352+00', '2026-07-16 22:22:46.887352+00'),
  ('f9e67eee-7951-4cff-887b-09f105826fb0', 'Wheelchair & Accessories', 'wheelchair-accessories', 'Wheelchairs, scooters, and replacement parts.', 'WheelchairIcon', 40, true, '2026-07-16 22:22:46.887352+00', '2026-07-16 22:22:46.887352+00'),
  ('354d4bef-215a-4c61-b9fc-a565e0f8fd40', 'Nutrition', 'nutrition', 'Nutritional supplements and feeding supplies.', 'NutritionIcon', 50, true, '2026-07-16 22:22:46.887352+00', '2026-07-16 22:22:46.887352+00'),
  ('ae2bc631-64ad-4e56-a149-de4f1381f1f7', 'Respiratory Care', 'respiratory-care', 'Oxygen concentrators, nebulizers, and accessories.', 'RespiratoryIcon', 60, true, '2026-07-16 22:22:46.887352+00', '2026-07-16 22:22:46.887352+00'),
  ('16fb7aa4-5327-41c2-981e-ff9ba5a11062', 'Urological', 'urological', 'Catheters, drainage bags, and urological supplies.', 'UrologicalIcon', 70, true, '2026-07-16 22:22:46.887352+00', '2026-07-16 22:22:46.887352+00'),
  ('fa033135-bc94-4377-b5a9-482642634c6e', 'Wound Care', 'wound-care', 'Dressings, bandages, and skin care supplies.', 'WoundCareIcon', 80, true, '2026-07-16 22:22:46.887352+00', '2026-07-16 22:22:46.887352+00');
