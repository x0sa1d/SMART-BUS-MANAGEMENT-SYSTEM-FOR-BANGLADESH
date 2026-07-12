import { Suspense } from "react";
import { DestinationsView } from "@/features/locations/destinations-view";
import { TableSkeleton } from "@/components/shared/skeleton-loaders";

export default function DestinationsPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={8} />}>
      <DestinationsView />
    </Suspense>
  );
}
