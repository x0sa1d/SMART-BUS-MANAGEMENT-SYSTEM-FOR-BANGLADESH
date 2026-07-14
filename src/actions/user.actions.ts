"use server";

import { revalidateSystem } from "@/lib/revalidate-system";
import { hashPassword } from "better-auth/crypto";
import { db, excludeDeleted } from "@/lib/db";
import {
  requireSuperAdmin,
  requirePlatformAdmin,
  requireUserManagement,
  requireAuth,
} from "@/lib/auth-server";
import { success, failure, getErrorMessage } from "@/lib/action-utils";
import { adminSchema, createUserSchema, profileSchema, updateUserRoleSchema } from "@/schemas";
import { ROLE_LABELS, isRemovableUserRole } from "@/lib/permissions";
import { ensureDriverProfileForUser, unlinkDriverProfile } from "@/lib/user-profiles";
import type { Role } from "@prisma/client";

export async function getUsers() {
  await requireUserManagement();
  return db.user.findMany({
    where: excludeDeleted(),
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      companyId: true,
      company: { select: { name: true } },
      emailVerified: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdmins() {
  await requirePlatformAdmin();
  return db.user.findMany({
    where: { ...excludeDeleted(), role: "MANAGER", companyId: null },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerified: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

async function upsertCredentialUser(
  email: string,
  name: string,
  password: string,
  role: Role,
  companyId?: string | null
) {
  const existing = await db.user.findUnique({ where: { email } });
  const hashedPassword = await hashPassword(password);

  if (existing?.deletedAt) {
    await db.user.update({
      where: { id: existing.id },
      data: { name, email, role, companyId: companyId ?? null, emailVerified: true, deletedAt: null },
    });
    const account = await db.account.findFirst({
      where: { userId: existing.id, providerId: "credential" },
    });
    if (account) {
      await db.account.update({ where: { id: account.id }, data: { password: hashedPassword } });
    } else {
      await db.account.create({
        data: {
          id: crypto.randomUUID(),
          accountId: existing.id,
          providerId: "credential",
          userId: existing.id,
          password: hashedPassword,
        },
      });
    }
    return existing.id;
  }

  if (existing && !existing.deletedAt) {
    throw new Error("A user with this email already exists");
  }

  const userId = crypto.randomUUID();
  await db.user.create({
    data: {
      id: userId,
      name,
      email,
      emailVerified: true,
      role,
      companyId: companyId ?? null,
      accounts: {
        create: {
          id: crypto.randomUUID(),
          accountId: userId,
          providerId: "credential",
          password: hashedPassword,
        },
      },
    },
  });
  return userId;
}

export async function createAdmin(formData: FormData) {
  try {
    await requirePlatformAdmin();
    const parsed = adminSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return failure(parsed.error.errors[0].message);

    const { name, email, password } = parsed.data;
    await upsertCredentialUser(email, name, password, "MANAGER", null);

    revalidateSystem();
    return success({ email });
  } catch (error) {
    return failure(getErrorMessage(error));
  }
}

export async function createUser(formData: FormData) {
  try {
    await requireUserManagement();
    const raw = Object.fromEntries(formData);
    const parsed = createUserSchema.safeParse({
      ...raw,
      companyId: raw.companyId || undefined,
    });
    if (!parsed.success) return failure(parsed.error.errors[0].message);

    const { name, email, password, role, companyId } = parsed.data;

    if (role === "MANAGER" && !companyId) {
      return failure("Platform Admin accounts must be created from the Admins panel.");
    }

    if (role === "MANAGER" && companyId) {
      const company = await db.busCompany.findFirst({
        where: { id: companyId, deletedAt: null },
      });
      if (!company) return failure("Company not found");
    }

    const userId = await upsertCredentialUser(email, name, password, role, role === "MANAGER" ? companyId : null);

    if (role === "DRIVER") {
      await ensureDriverProfileForUser(userId, { fullName: name, email });
    }

    revalidateSystem();
    return success({ email });
  } catch (error) {
    return failure(getErrorMessage(error));
  }
}

/** Update role assignment only — never changes email, password, or name. */
export async function updateUserRole(formData: FormData) {
  try {
    await requireUserManagement();
    const parsed = updateUserRoleSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return failure(parsed.error.errors[0].message);

    const { userId, role, companyId } = parsed.data;
    const user = await db.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!user) return failure("User not found");

    if (user.role === "SUPER_ADMIN") {
      return failure("Super Admin role cannot be changed");
    }
    if (user.role === "MANAGER" && !user.companyId) {
      return failure("Platform Admin accounts are managed from the Admins panel");
    }

    if (role === "MANAGER" && companyId) {
      const company = await db.busCompany.findFirst({ where: { id: companyId, deletedAt: null } });
      if (!company) return failure("Company not found");
    }

    if (role === "MANAGER" && !companyId) {
      return failure("Platform Admin accounts are managed from the Admins panel.");
    }

    const previousRole = user.role;

    await db.user.update({
      where: { id: userId },
      data: {
        role,
        companyId: role === "MANAGER" ? companyId ?? null : null,
      },
    });

    if (role === "DRIVER") {
      await ensureDriverProfileForUser(userId, { fullName: user.name, email: user.email });
    } else if (previousRole === "DRIVER") {
      await unlinkDriverProfile(userId);
    }

    revalidateSystem();
    return success(null);
  } catch (error) {
    return failure(getErrorMessage(error));
  }
}

export async function removeAdmin(userId: string) {
  try {
    await requireSuperAdmin();
    const user = await db.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!user) return failure("User not found");
    if (user.role !== "MANAGER" || user.companyId) {
      return failure("Only platform Admin accounts can be removed here.");
    }

    await db.$transaction([
      db.session.deleteMany({ where: { userId } }),
      db.user.update({
        where: { id: userId },
        data: { deletedAt: new Date(), role: "PASSENGER" },
      }),
    ]);

    revalidateSystem();
    return success(null);
  } catch (error) {
    return failure(getErrorMessage(error));
  }
}

export async function removeUser(userId: string) {
  try {
    const access = await requireUserManagement();
    const user = await db.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!user) return failure("User not found");

    if (!isRemovableUserRole(user.role, user.companyId)) {
      if (user.role === "MANAGER" && !user.companyId) {
        return failure("Only Super Admin can remove Admin accounts.");
      }
      return failure(`Cannot remove ${ROLE_LABELS[user.role]} accounts from here.`);
    }

    if (!access.canRemoveUser) {
      return failure("You do not have permission to remove users.");
    }

    await db.$transaction([
      db.session.deleteMany({ where: { userId } }),
      db.user.update({
        where: { id: userId },
        data: { deletedAt: new Date() },
      }),
    ]);

    revalidateSystem();
    return success(null);
  } catch (error) {
    return failure(getErrorMessage(error));
  }
}

export async function updateMyProfile(formData: FormData) {
  try {
    const session = await requireAuth();
    const parsed = profileSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return failure(parsed.error.errors[0].message);

    await db.user.update({
      where: { id: session.user.id },
      data: { name: parsed.data.name },
    });

    revalidateSystem();
    return success(null);
  } catch (error) {
    return failure(getErrorMessage(error));
  }
}
