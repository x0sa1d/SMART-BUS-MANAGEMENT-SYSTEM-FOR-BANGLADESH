import { Suspense } from "react";
import { requireUserManagement } from "@/lib/auth-server";
import { PoliciesView } from "@/features/policies/policies-view";
import { TableSkeleton } from "@/components/shared/skeleton-loaders";

export default async function PoliciesPage() {
  await requireUserManagement();
  return (
    <Suspense fallback={<TableSkeleton />}>
      <PoliciesView />
    </Suspense>
  );
}
