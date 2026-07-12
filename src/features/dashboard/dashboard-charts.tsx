"use client";

import dynamic from "next/dynamic";
import type { ChartDataPoint, RoutePerformance } from "@/types";
import { ChartSkeletonGrid } from "@/components/shared/skeleton-loaders";

const DashboardChartsInner = dynamic(
  () => import("./dashboard-charts-inner").then((m) => m.DashboardChartsInner),
  { loading: () => <ChartSkeletonGrid />, ssr: false }
);

interface Props {
  revenueTrend: ChartDataPoint[];
  bookingTrend: ChartDataPoint[];
  passengerGrowth: ChartDataPoint[];
  occupancyTrend: ChartDataPoint[];
  routePopularity: ChartDataPoint[];
  routePerformance: RoutePerformance[];
  companyPerformance: ChartDataPoint[];
}

export function DashboardCharts(props: Props) {
  return <DashboardChartsInner {...props} />;
}
