"use client";

import { usePermissions } from "@/components/providers/permissions-provider";
import { Building2 } from "lucide-react";

export function ReadOnlyBanner() {
  const { isCompanyAdmin, canManageCompanySchedules, companyName } = usePermissions();

  if (isCompanyAdmin && canManageCompanySchedules) {
    return (
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary">
        <Building2 className="h-4 w-4 shrink-0" />
        <span>
          Managing <strong>{companyName}</strong>. You can update schedules for your company&apos;s buses only.
        </span>
      </div>
    );
  }

  return null;
}
