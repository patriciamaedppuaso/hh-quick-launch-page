-- Sample/placeholder data for the apps added this round that didn't get
-- any yet (Driver's Routes already has its own examples from 0024). Same
-- clearly-labeled placeholder pattern as 0012_reset_and_reseed_demo_data.sql.

-- ===================================================================
-- Respiratory Log -- one patient in the Hospice folder, one unfiled
-- ===================================================================
insert into respiratory_patients (id, app_id, folder, patient_name, city, due_date, log_date) values
  ('resp-example-1', 'respiratory-log', 'Hospice', 'Example Patient (Hospice)', 'Whittier', current_date + 7, current_date),
  ('resp-example-2', 'respiratory-log', null, 'Example Patient (No Folder)', 'Los Angeles', current_date + 14, current_date);

insert into respiratory_equipment (id, patient_id, name, status) values
  ('resp-example-1-equip-1', 'resp-example-1', 'Oxygen Concentrator', 'ongoing'),
  ('resp-example-2-equip-1', 'resp-example-2', 'CPAP Machine', 'returned');

-- ===================================================================
-- Printed Invoice -- one to be printed, one already printed
-- ===================================================================
insert into printed_invoices (id, app_id, folder, patient_name, address, hospice, order_type, notes, status, date) values
  ('inv-example-1', 'printed-invoice', null, 'Example Patient', '123 Example St, Whittier, CA', 'Example Hospice', 'Delivery', 'Placeholder -- replace with a real invoice.', 'to_be_printed', current_date),
  ('inv-example-2', 'printed-invoice', null, 'Example Patient Two', '456 Sample Ave, Los Angeles, CA', 'Example Hospice', 'Pickup', 'Placeholder -- already printed.', 'printed', current_date - 3);

-- ===================================================================
-- Purchase Orders -- one unpaid, one paid
-- ===================================================================
insert into purchase_order_invoices (id, app_id, folder, name, url, is_file, status) values
  ('po-example-1', 'purchase-orders', null, 'Example Vendor Invoice (Unpaid)', '', false, 'unpaid'),
  ('po-example-2', 'purchase-orders', null, 'Example Vendor Invoice (Paid)', '', false, 'paid');

-- ===================================================================
-- Vehicle Inspection Report -- one clean pre-trip, one post-trip with a
-- flagged defect
-- ===================================================================
insert into vehicle_inspections (id, app_id, driver_name, date, trip_type, location, license_plate, vehicle, odometer, remarks, condition_acceptable, certified) values
  ('vi-example-1', 'vehicle-inspections', 'Example Driver', current_date, 'pre_trip', 'Whittier, CA', 'EX12345', 'Ford Transit', 100000, 'Placeholder -- no issues found.', true, true),
  ('vi-example-2', 'vehicle-inspections', 'Example Driver', current_date, 'post_trip', 'Whittier, CA', 'EX12345', 'Ford Transit', 100120, 'Placeholder -- tail light out, needs replacement.', false, true);

insert into vehicle_inspection_defects (inspection_id, item_name) values
  ('vi-example-2', 'Lights');

-- ===================================================================
-- Vehicle Equipment Inspection Checklist -- one fully confirmed log, one
-- with a couple of items missing
-- ===================================================================
insert into equipment_checklists (id, app_id, employee_name, date, certified) values
  ('ec-example-1', 'equipment-checklist', 'Example Employee', current_date, true),
  ('ec-example-2', 'equipment-checklist', 'Example Employee Two', current_date, true);

insert into equipment_checklist_items (checklist_id, item_name) values
  ('ec-example-1', 'Hospital Bed'), ('ec-example-1', 'Full / Half Rails'), ('ec-example-1', 'Hospital Bed Mattress'),
  ('ec-example-1', 'APP'), ('ec-example-1', 'O2 Conc 5L'), ('ec-example-1', 'Portable System'),
  ('ec-example-1', 'Hand Held Nebulizer'), ('ec-example-1', 'Suction Machine'), ('ec-example-1', 'Transport Wheelchair'),
  ('ec-example-1', 'Shower Chair'), ('ec-example-1', 'Bedside Commode'), ('ec-example-1', 'Bedside Table'),
  ('ec-example-1', 'Adult Walker'), ('ec-example-1', 'Mattress Covers (Zip)'), ('ec-example-1', '7" Nasal Cannula'),
  ('ec-example-1', '25" Nasal Cannula'), ('ec-example-1', '50" Nasal Cannula'), ('ec-example-1', 'Oxygen Mask'),
  ('ec-example-1', 'Humidifier Bottles'), ('ec-example-1', 'Nebulizer Kit'), ('ec-example-1', 'Aerosol Mask'),
  ('ec-example-1', 'Suction Yanker'), ('ec-example-1', 'Suction Tubing'), ('ec-example-1', 'Suction Canister'),
  -- example 2: missing Suction Machine and Oxygen Mask, to show the flagged/missing state
  ('ec-example-2', 'Hospital Bed'), ('ec-example-2', 'Full / Half Rails'), ('ec-example-2', 'Hospital Bed Mattress'),
  ('ec-example-2', 'APP'), ('ec-example-2', 'O2 Conc 5L'), ('ec-example-2', 'Portable System'),
  ('ec-example-2', 'Hand Held Nebulizer'), ('ec-example-2', 'Transport Wheelchair'),
  ('ec-example-2', 'Shower Chair'), ('ec-example-2', 'Bedside Commode'), ('ec-example-2', 'Bedside Table'),
  ('ec-example-2', 'Adult Walker'), ('ec-example-2', 'Mattress Covers (Zip)'), ('ec-example-2', '7" Nasal Cannula'),
  ('ec-example-2', '25" Nasal Cannula'), ('ec-example-2', '50" Nasal Cannula'),
  ('ec-example-2', 'Humidifier Bottles'), ('ec-example-2', 'Nebulizer Kit'), ('ec-example-2', 'Aerosol Mask'),
  ('ec-example-2', 'Suction Yanker'), ('ec-example-2', 'Suction Tubing'), ('ec-example-2', 'Suction Canister');

-- ===================================================================
-- Accounts & Passwords -- one example shared login
-- ===================================================================
insert into account_credentials (id, app_id, name, category, email, password, url, notes, updated_at) values
  ('account-example-1', 'accounts-passwords', 'Example Software Account', 'Software', 'admin@example.com', 'ExamplePassword123!', 'https://example.com/login', 'Placeholder -- replace with a real shared login.', current_date);
