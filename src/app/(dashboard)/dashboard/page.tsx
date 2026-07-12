import { Suspense } from "react";
import { DashboardView } from "@/features/dashboard/dashboard-view";
import { DashboardSkeleton } from "@/components/shared/skeleton-loaders";

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardView />
    </Suspense>
  );
}
