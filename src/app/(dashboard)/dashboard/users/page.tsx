import { Suspense } from "react";
import { requireUserManagement } from "@/lib/auth-server";
import { UsersView } from "@/features/users/users-view";
import { TableSkeleton } from "@/components/shared/skeleton-loaders";

export default async function UsersPage() {
  await requireUserManagement();
  return (
    <Suspense fallback={<TableSkeleton />}>
      <UsersView />
    </Suspense>
  );
}
