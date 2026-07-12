import type { Role, CompanyStatus } from "@prisma/client";

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  MANAGER: "Admin",
  DRIVER: "Driver",
  PASSENGER: "Passenger",
};

export type AccessContext = {
  role: Role;
  canWrite: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isPlatformAdmin: boolean;
  isCompanyAdmin: boolean;
  canManageUsers: boolean;
  canManageAdmins: boolean;
  canRemoveAdmin: boolean;
  canRemoveUser: boolean;
  canManageAllSchedules: boolean;
  canManageCompanySchedules: boolean;
  companyId: string | null;
  companyName: string | null;
  companyStatus: CompanyStatus | null;
  roleLabel: string;
};

type UserLike = {
  role?: Role | string | null;
  companyId?: string | null;
  company?: { id: string; name: string; status: CompanyStatus } | null;
};

export function getRoleFromUser(user: { role?: Role | string | null }): Role {
  const role = user.role as Role | undefined;
  if (role && role in ROLE_LABELS) return role;
  return "PASSENGER";
}

export function getAccessContext(user: UserLike): AccessContext {
  const role = getRoleFromUser(user);
  const company = user.company ?? null;
  const companyId = user.companyId ?? company?.id ?? null;
  const companyStatus = company?.status ?? null;
  const isCompanyAdmin = role === "MANAGER" && !!companyId;
  const isPlatformAdmin = role === "MANAGER" && !companyId;
  const isSuperAdmin = role === "SUPER_ADMIN";

  const canWritePlatform = isSuperAdmin || isPlatformAdmin;
  const canWrite =
    canWritePlatform || (isCompanyAdmin && companyStatus === "ACTIVE");

  let roleLabel = ROLE_LABELS[role];
  if (isCompanyAdmin) roleLabel = "Company Admin";
  else if (isPlatformAdmin) roleLabel = "Admin";

  return {
    role,
    canWrite,
    isSuperAdmin,
    isAdmin: role === "MANAGER",
    isPlatformAdmin,
    isCompanyAdmin,
    canManageUsers: canWritePlatform,
    canManageAdmins: canWritePlatform,
    canRemoveAdmin: isSuperAdmin,
    canRemoveUser: canWritePlatform,
    canManageAllSchedules: canWritePlatform,
    canManageCompanySchedules: isCompanyAdmin && companyStatus === "ACTIVE",
    companyId,
    companyName: company?.name ?? null,
    companyStatus,
    roleLabel,
  };
}

export function getCompanyGatePath(status: CompanyStatus | null | undefined): string | null {
  if (status === "PENDING") return "/company/pending";
  if (status === "REJECTED") return "/company/rejected";
  if (status === "SUSPENDED") return "/company/suspended";
  return null;
}

export function isRemovableUserRole(role: Role, companyId: string | null | undefined): boolean {
  if (role === "SUPER_ADMIN") return false;
  if (role === "MANAGER" && !companyId) return false;
  return true;
}
