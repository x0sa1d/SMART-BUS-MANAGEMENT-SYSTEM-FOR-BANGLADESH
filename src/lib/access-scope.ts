import type { AccessContext } from "@/lib/permissions";
import { excludeDeleted } from "@/lib/db";

export function companyBusFilter(access: AccessContext) {
  if (access.isSuperAdmin || access.isPlatformAdmin) {
    return excludeDeleted();
  }
  if (access.companyId) {
    return { ...excludeDeleted(), companyId: access.companyId };
  }
  return { ...excludeDeleted(), id: "__none__" };
}

export function companyDriverFilter(access: AccessContext) {
  if (access.isSuperAdmin || access.isPlatformAdmin) {
    return excludeDeleted();
  }
  if (access.companyId) {
    return { ...excludeDeleted(), companyId: access.companyId };
  }
  return { ...excludeDeleted(), id: "__none__" };
}

export function companyScheduleFilter(access: AccessContext) {
  if (access.isSuperAdmin || access.isPlatformAdmin) {
    return excludeDeleted();
  }
  if (access.companyId) {
    return {
      ...excludeDeleted(),
      bus: { companyId: access.companyId, deletedAt: null },
    };
  }
  return { ...excludeDeleted(), id: "__none__" };
}
