-- Driver's Routes: a "finished" checkbox per stop, plus a persisted
-- sort_order so drag-to-reorder within a day's route sticks across
-- reloads -- see RoutesPage.tsx.
alter table route_stops add column finished boolean not null default false;
alter table route_stops add column sort_order integer not null default 0;
create index route_stops_sort_order_idx on route_stops(sort_order);
