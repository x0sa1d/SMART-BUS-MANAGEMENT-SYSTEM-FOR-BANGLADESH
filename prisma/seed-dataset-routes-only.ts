import { db } from "@/lib/db";
import { seedDatasetRoutes, seedDatasetServices } from "./seed-dataset-routes";

async function main() {
  await seedDatasetRoutes();
  await seedDatasetServices();
  console.log("Dataset route seed done.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
