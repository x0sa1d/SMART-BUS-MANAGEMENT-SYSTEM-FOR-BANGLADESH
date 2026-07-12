"use server";

import { db } from "@/lib/db";
import { requireUserManagement } from "@/lib/auth-server";
import { success, failure, getErrorMessage } from "@/lib/action-utils";
import { revalidateSystem } from "@/lib/revalidate-system";
import type { Role } from "@prisma/client";

const MANAGED_ROLES: Role[] = ["SUPER_ADMIN", "MANAGER", "DRIVER", "PASSENGER"];

export async function getRolePolicies() {
  await requireUserManagement();

  const [permissions, assignments] = await Promise.all([
    db.permission.findMany({ orderBy: [{ module: "asc" }, { name: "asc" }] }),
    db.rolePermission.findMany(),
  ]);

  const matrix: Record<Role, string[]> = {
    SUPER_ADMIN: [],
    MANAGER: [],
    DRIVER: [],
    PASSENGER: [],
  };

  for (const a of assignments) {
    matrix[a.role].push(a.permissionId);
  }

  return { permissions, matrix };
}

export async function setRolePolicy(role: Role, permissionId: string, enabled: boolean) {
  try {
    await requireUserManagement();

    if (!MANAGED_ROLES.includes(role)) {
      return failure("Invalid role");
    }

    if (enabled) {
      await db.rolePermission.upsert({
        where: { role_permissionId: { role, permissionId } },
        update: {},
        create: { role, permissionId },
      });
    } else {
      await db.rolePermission.deleteMany({ where: { role, permissionId } });
    }

    revalidateSystem();
    return success(null);
  } catch (error) {
    return failure(getErrorMessage(error));
  }
}
