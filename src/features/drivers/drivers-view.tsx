import { getDrivers } from "@/actions/driver.actions";
import { DriversContent } from "./drivers-content";

export async function DriversView() {
  const drivers = await getDrivers();
  return <DriversContent drivers={JSON.parse(JSON.stringify(drivers))} />;
}
