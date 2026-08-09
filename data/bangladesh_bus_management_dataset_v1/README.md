# Bangladesh Bus Management Dataset — Demo v1.0

Generated: 2026-08-09

## Files
- districts.csv — all 64 Bangladesh districts and divisions.
- routes_320.csv — 320 curated inter-district route candidates.
- route_stops.csv — 1518 route-stop records.
- services_demo.csv — demo service records for application testing.
- bangladesh_bus_management_dataset.json — combined JSON version.

## IMPORTANT DATA QUALITY NOTE
The district list is based on the Bangladesh National Portal. BRTA publishes official inter-district/long-distance route and fare lists. However, this package deliberately labels route paths, stops, fares, distances, schedules and operator assignments as curated/demo values where they have not been individually verified against a current operator permit or BRTA record.

Do NOT present the route rows as official live schedules. Before production deployment, verify each route with BRTA and the relevant bus operator and replace estimated fields with verified values.

## Suggested database relationships
districts.district_id -> routes.origin_district / destination_district (by district name)
routes.route_id -> route_stops.route_id
routes.route_id -> services_demo.route_id

## Source references
1. Bangladesh National Portal — Districts:
   https://bangladesh.gov.bd/views/district-list/
2. BRTA — Inter-district and long-distance bus fare/route lists:
   https://brta.gov.bd/site/page/1a7a3abe-99a0-473c-abf7-b232d0ee5edd/
