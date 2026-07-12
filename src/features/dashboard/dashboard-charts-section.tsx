import { getDashboardChartBundle } from "@/services/dashboard.service";
import { DashboardCharts } from "./dashboard-charts";

export async function DashboardChartsSection() {
  const charts = await getDashboardChartBundle();
  return <DashboardCharts {...charts} />;
}
