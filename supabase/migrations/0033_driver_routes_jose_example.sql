-- Driver's Routes -- a few example stops under Jose Arreguin, same
-- placeholder pattern as 0024_driver_routes_examples.sql, so his route view
-- has something to look at right away.

insert into route_stops (
  id, app_id, driver, date, start_time, end_time, mileage,
  customer_name, street, city, driver_eta, schedule_eta, service_performed, note, flagged
) values
  ('route-jose-1', 'driver-routes', 'Jose Arreguin', current_date, '7:45', '8:00', null,
   'OFFICE', null, null, null, null, null, 'Placeholder -- non-customer stops like OFFICE/GAS/LUNCH just fill in the name.', false),
  ('route-jose-2', 'driver-routes', 'Jose Arreguin', current_date, '8:30', '8:55', 15,
   'Carlos Mendoza', '4210 Whittier Blvd', 'Whittier', '25 mins', null, 'P/U EQUIP', 'Placeholder -- a completed pickup with mileage logged.', false),
  ('route-jose-3', 'driver-routes', 'Jose Arreguin', current_date, '9:40', '10:05', 8,
   'Linda Fuentes', '1580 S Greenwood Ave', 'Montebello', '15 mins', null, 'P/U BED', 'Placeholder -- another completed stop.', false),
  ('route-jose-4', 'driver-routes', 'Jose Arreguin', current_date, null, null, null,
   'Robert Nguyen', '890 E Beverly Blvd', 'Montebello', null, null, 'P/U EQUIP', 'Placeholder -- no one answered. Flagged stops highlight red.', true),
  ('route-jose-5', 'driver-routes', 'Jose Arreguin', current_date, null, null, null,
   'Angela Ramirez', '2210 N Studebaker Rd', 'Long Beach', null, '2-4PM', 'P/U FULL SET-UP', 'Placeholder -- a scheduled stop not yet visited, no times logged yet.', false);
