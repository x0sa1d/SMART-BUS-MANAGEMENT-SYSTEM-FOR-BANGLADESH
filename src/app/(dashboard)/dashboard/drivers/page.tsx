import { Suspense } from "react";
import { DriversView } from "@/features/drivers/drivers-view";
import { TableSkeleton } from "@/components/shared/skeleton-loaders";

export default function DriversPage() {
  return <Suspense fallback={<TableSkeleton />}><DriversView /></Suspense>;
}
