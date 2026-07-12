import { getRoutes } from "@/actions/route.actions";
import { RoutesContent } from "./routes-content";

export async function RoutesView() {
  const routes = await getRoutes();
  return <RoutesContent routes={JSON.parse(JSON.stringify(routes))} />;
}
