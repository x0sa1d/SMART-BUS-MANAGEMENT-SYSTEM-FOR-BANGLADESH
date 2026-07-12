import { Suspense } from "react";
import { BookingsView } from "@/features/bookings/bookings-view";
import { TableSkeleton } from "@/components/shared/skeleton-loaders";

export default function BookingsPage() {
  return <Suspense fallback={<TableSkeleton />}><BookingsView /></Suspense>;
}
