import { db } from "@/lib/db";
import { seedFleet, refreshScheduleFares, BUSES_PER_ROUTE } from "./seed-fleet";

async function main() {
  const busesPerRoute = Number(process.env.FLEET_BUSES_PER_ROUTE || BUSES_PER_ROUTE);
  console.log(`Running fleet seed (${busesPerRoute} buses per route)...`);
  await seedFleet(busesPerRoute);
  await refreshScheduleFares();
  console.log("Fleet seed done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
