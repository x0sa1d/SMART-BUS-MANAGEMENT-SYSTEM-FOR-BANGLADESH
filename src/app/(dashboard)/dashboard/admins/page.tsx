import { Suspense } from "react";
import { requirePlatformAdmin } from "@/lib/auth-server";
import { AdminsView } from "@/features/admins/admins-view";
import { TableSkeleton } from "@/components/shared/skeleton-loaders";

export default async function AdminsPage() {
  await requirePlatformAdmin();
  return (
    <Suspense fallback={<TableSkeleton />}>
      <AdminsView />
    </Suspense>
  );
}
