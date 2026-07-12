import { Suspense } from "react";
import { DashboardKpiSection } from "./dashboard-kpi-section";
import { DashboardChartsSection } from "./dashboard-charts-section";
import { ChartSkeletonGrid } from "@/components/shared/skeleton-loaders";

export async function DashboardView() {
  return (
    <div className="space-y-6 page-enter">
      <DashboardKpiSection />
      <Suspense fallback={<ChartSkeletonGrid />}>
        <DashboardChartsSection />
      </Suspense>
    </div>
  );
}
