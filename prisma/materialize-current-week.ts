import { db } from "@/lib/db";
import { addDaysUtc } from "@/lib/district-search";
import { calendarDateKey } from "@/lib/calendar-date";
import { parseLocalDate } from "@/lib/utils";
import { materializeAllTripsInWindow } from "@/lib/trip-ensure";

async function main() {
  const days = Number(process.env.FLEET_TRIP_DAYS || 8);
  const start = parseLocalDate(calendarDateKey());
  const end = addDaysUtc(start, days - 1);
  console.log(`Materializing trips ${calendarDateKey(start)} → ${calendarDateKey(end)} (${days} days)...`);
  await materializeAllTripsInWindow(start, end);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
