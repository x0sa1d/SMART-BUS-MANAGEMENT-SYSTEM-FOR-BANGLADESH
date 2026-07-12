import type { Role, CompanyStatus } from "@prisma/client";

export const HOME_PATH_COOKIE = "sbm-home";

type UserRedirect = {
  role?: Role | string | null;
  companyId?: string | null;
  companyStatus?: CompanyStatus | null;
};

export function getHomePathForUser(user: UserRedirect): string {
  const role = (user.role as Role) || "PASSENGER";

  if (role === "SUPER_ADMIN") return "/dashboard";
  if (role === "MANAGER") {
    if (user.companyId) {
      if (user.companyStatus === "PENDING") return "/company/pending";
      if (user.companyStatus === "REJECTED") return "/company/rejected";
      if (user.companyStatus === "SUSPENDED") return "/company/suspended";
      if (user.companyStatus === "ACTIVE") return "/dashboard";
      return "/company/pending";
    }
    return "/dashboard";
  }
  if (role === "DRIVER") return "/driver";
  return "/passenger";
}

/** @deprecated use getHomePathForUser */
export function getHomePathForRole(role: Role): string {
  return getHomePathForUser({ role });
}

export function setHomePathCookie(path: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${HOME_PATH_COOKIE}=${encodeURIComponent(path)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

export function clearHomePathCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${HOME_PATH_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}
