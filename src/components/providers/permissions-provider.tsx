"use client";

import { createContext, useContext } from "react";
import type { AccessContext } from "@/lib/permissions";

const PermissionsContext = createContext<AccessContext | null>(null);

const defaultAccess: AccessContext = {
  role: "PASSENGER",
  canWrite: false,
  isSuperAdmin: false,
  isAdmin: false,
  isPlatformAdmin: false,
  isCompanyAdmin: false,
  canManageUsers: false,
  canManageAdmins: false,
  canRemoveAdmin: false,
  canRemoveUser: false,
  canManageAllSchedules: false,
  canManageCompanySchedules: false,
  companyId: null,
  companyName: null,
  companyStatus: null,
  roleLabel: "Passenger",
};

export function PermissionsProvider({
  value,
  children,
}: {
  value: AccessContext;
  children: React.ReactNode;
}) {
  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
}

export function usePermissions() {
  return useContext(PermissionsContext) ?? defaultAccess;
}
