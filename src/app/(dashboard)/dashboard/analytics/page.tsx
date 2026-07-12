import { getRevenueTrend, getRoutePopularity } from "@/services/dashboard.service";
import { AnalyticsContent } from "@/features/analytics/analytics-content";

export default async function AnalyticsPage() {
  const [revenue, routes] = await Promise.all([getRevenueTrend(), getRoutePopularity()]);
  return <AnalyticsContent revenue={revenue} routes={routes} />;
}
