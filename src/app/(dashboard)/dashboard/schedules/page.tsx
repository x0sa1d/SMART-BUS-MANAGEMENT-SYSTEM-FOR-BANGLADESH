import { Suspense } from "react";
import { SchedulesView } from "@/features/schedules/schedules-view";
import { TableSkeleton } from "@/components/shared/skeleton-loaders";

export default function SchedulesPage() {
  return <Suspense fallback={<TableSkeleton />}><SchedulesView /></Suspense>;
}
