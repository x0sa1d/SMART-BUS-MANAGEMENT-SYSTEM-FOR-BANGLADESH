import { getBuses } from "@/actions/bus.actions";
import { BusesContent } from "./buses-content";

export async function BusesView() {
  const buses = await getBuses();
  return <BusesContent buses={JSON.parse(JSON.stringify(buses))} />;
}
