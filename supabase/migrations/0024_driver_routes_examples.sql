-- Driver's Routes -- a few clearly-labeled example stops under "Example
-- Driver" showing the different row types (an office stop, a completed
-- pickup with mileage/ETA, a flagged problem stop, and a scheduled/pending
-- stop with no times yet), same placeholder-data pattern as
-- 0012_reset_and_reseed_demo_data.sql.

insert into route_stops (
  id, app_id, driver, date, start_time, end_time, mileage,
  customer_name, street, city, driver_eta, schedule_eta, service_performed, note, flagged
) values
  ('route-example-1', 'driver-routes', 'Example Driver', current_date, '8:00', '8:15', null,
   'OFFICE', null, null, null, null, null, 'Placeholder -- non-customer stops like OFFICE/GAS/LUNCH just fill in the name.', false),
  ('route-example-2', 'driver-routes', 'Example Driver', current_date, '9:05', '9:30', 12,
   'Maria Torres', '1200 S Union Ave', 'Los Angeles', '20 mins', null, 'P/U EQUIP', 'Placeholder -- a completed pickup with mileage logged.', false),
  ('route-example-3', 'driver-routes', 'Example Driver', current_date, null, null, null,
   'Michael Hall', '5521 McLenna Avenue', 'Encino', null, null, 'P/U EQUIP', 'Placeholder -- no one answered. Flagged stops highlight red.', true),
  ('route-example-4', 'driver-routes', 'Example Driver', current_date, null, null, null,
   'Pedro Cifuentes', '1719 West 55th Street', 'Los Angeles', null, '1-3PM', 'P/U FULL SET-UP', 'Placeholder -- a scheduled stop not yet visited, no times logged yet.', false);
