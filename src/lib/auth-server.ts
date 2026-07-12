import { cache } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { getAccessContext, getRoleFromUser, getCompanyGatePath, type AccessContext } from "@/lib/permissions";

export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

export async function getSessionUserWithCompany() {
  const session = await getSession();
  if (!session) return null;
  const user = await db.user.findFirst({
    where: { id: session.user.id, deletedAt: null },
    include: { company: true },
  });
  if (!user) return null;
  return { session, user };
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireRole(allowedRoles: Role[]) {
  const session = await requireAuth();
  const userRole = getRoleFromUser(session.user);
  if (!allowedRoles.includes(userRole)) redirect("/unauthorized");
  return session;
}

export async function requireSuperAdmin() {
  return requireRole(["SUPER_ADMIN"]);
}

export async function requirePlatformAdmin() {
  const data = await getSessionUserWithCompany();
  if (!data) redirect("/login");
  const role = getRoleFromUser(data.user);
  if (role !== "SUPER_ADMIN" && !(role === "MANAGER" && !data.user.companyId)) {
    redirect("/unauthorized");
  }
  return data;
}

export async function requireUserManagement(): Promise<AccessContext> {
  const access = await getDashboardAccess();
  if (!access.canManageUsers) redirect("/unauthorized");
  return access;
}

export async function requireManager() {
  const data = await getSessionUserWithCompany();
  if (!data) redirect("/login");

  const { user } = data;
  const role = getRoleFromUser(user);

  if (role === "SUPER_ADMIN") return data.session;
  if (role === "MANAGER") {
    if (user.companyId && user.company) {
      const gate = getCompanyGatePath(user.company.status);
      if (gate) redirect(gate);
    }
    return data.session;
  }

  redirect("/unauthorized");
}

export async function requireDriver() {
  return requireRole(["DRIVER", "SUPER_ADMIN", "MANAGER"]);
}

export async function requirePassenger() {
  return requireAuth();
}

export async function getDashboardAccess(): Promise<AccessContext> {
  const data = await getSessionUserWithCompany();
  if (!data) redirect("/login");

  const { user } = data;
  const role = getRoleFromUser(user);

  if (role === "PASSENGER" || role === "DRIVER") redirect("/unauthorized");

  if (role === "MANAGER" && user.companyId && user.company) {
    const gate = getCompanyGatePath(user.company.status);
    if (gate) redirect(gate);
  }

  if (role !== "SUPER_ADMIN" && role !== "MANAGER") redirect("/unauthorized");

  return getAccessContext({
    role: user.role,
    companyId: user.companyId,
    company: user.company,
  });
}

export async function requirePlatformWrite(): Promise<AccessContext> {
  const access = await getDashboardAccess();
  if (!access.isSuperAdmin && !access.isPlatformAdmin) redirect("/unauthorized");
  return access;
}

export async function requireWriteAccess(): Promise<AccessContext> {
  const access = await getDashboardAccess();
  if (!access.canWrite) redirect("/unauthorized");
  return access;
}

export async function requireScheduleAccess(): Promise<AccessContext> {
  const access = await getDashboardAccess();
  if (!access.canManageAllSchedules && !access.canManageCompanySchedules) {
    redirect("/unauthorized");
  }
  return access;
}

export async function assertBusInScope(busId: string, access: AccessContext) {
  if (access.canManageAllSchedules) return;

  if (!access.companyId) redirect("/unauthorized");

  const bus = await db.bus.findFirst({
    where: { id: busId, deletedAt: null },
    select: { companyId: true },
  });
  if (!bus || bus.companyId !== access.companyId) {
    redirect("/unauthorized");
  }
}
