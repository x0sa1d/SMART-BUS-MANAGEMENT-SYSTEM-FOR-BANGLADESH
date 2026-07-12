import { Suspense } from "react";
import { RoutesView } from "@/features/routes/routes-view";
import { TableSkeleton } from "@/components/shared/skeleton-loaders";

export default function RoutesPage() {
  return <Suspense fallback={<TableSkeleton />}><RoutesView /></Suspense>;
}
