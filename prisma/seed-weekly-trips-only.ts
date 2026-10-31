import { db } from "@/lib/db";
import { addDaysUtc } from "@/lib/district-search";
import { calendarDateKey } from "@/lib/calendar-date";
import { parseLocalDate } from "@/lib/utils";
import {
  seedWeeklyFleetPerRoute,
  refreshScheduleFares,
  MIN_BUSES_PER_ROUTE,
  MAX_BUSES_PER_ROUTE,
  TRIP_DAYS,
} from "./seed-fleet";
import { materializeAllTripsInWindow } from "@/lib/trip-ensure";

async function main() {
  const minBuses = Number(process.env.FLEET_MIN_BUSES || MIN_BUSES_PER_ROUTE);
  const maxBuses = Number(process.env.FLEET_MAX_BUSES || MAX_BUSES_PER_ROUTE);
  const tripDays = Number(process.env.FLEET_TRIP_DAYS || TRIP_DAYS);

  console.log(`Weekly trips seed (${minBuses}-${maxBuses} buses/route, ${tripDays} days)...`);
  await seedWeeklyFleetPerRoute(minBuses, maxBuses);

  const start = parseLocalDate(calendarDateKey());
  const end = addDaysUtc(start, tripDays - 1);
  await materializeAllTripsInWindow(start, end);

  await refreshScheduleFares();
  console.log("Weekly trips seed done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
