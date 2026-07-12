import { Suspense } from "react";
import { BusesView } from "@/features/buses/buses-view";
import { TableSkeleton } from "@/components/shared/skeleton-loaders";

export default function BusesPage() {
  return <Suspense fallback={<TableSkeleton />}><BusesView /></Suspense>;
}
