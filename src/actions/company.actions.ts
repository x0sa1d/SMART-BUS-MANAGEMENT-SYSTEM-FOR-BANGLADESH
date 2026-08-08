"use server";

import { revalidateSystem } from "@/lib/revalidate-system";
import { hashPassword } from "better-auth/crypto";
import { db, excludeDeleted, isDatabaseConfigured } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth-server";
import { success, failure, getErrorMessage } from "@/lib/action-utils";
import {
  companyApplicationSchema,
  createCompanySchema,
  rejectCompanySchema,
} from "@/schemas";

function slugifyCode(name: string) {
  const base = name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 12);
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${base || "CO"}-${suffix}`;
}

export async function searchActiveCompanies(query?: string) {
  if (!isDatabaseConfigured()) return [];
  try {
    const where = {
      ...excludeDeleted(),
      status: "ACTIVE" as const,
      ...(query?.trim()
        ? { name: { contains: query.trim(), mode: "insensitive" as const } }
        : {}),
    };

    return await db.busCompany.findMany({
      where,
      select: { id: true, name: true, code: true, rating: true, fleetSize: true },
      orderBy: [{ isNational: "desc" }, { name: "asc" }],
      take: query?.trim() ? 50 : 100,
    });
  } catch {
    return [];
  }
}

export async function getCompanies(page = 1, pageSize = 20, search?: string, status?: string) {
  if (!isDatabaseConfigured()) {
    return { items: [], total: 0, page, pageSize, totalPages: 0 };
  }
  try {
    const where = {
      ...excludeDeleted(),
      ...(status ? { status: status as "ACTIVE" | "PENDING" | "SUSPENDED" | "REJECTED" } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { code: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      db.busCompany.findMany({
        where,
        include: {
          district: { include: { division: true } },
          _count: { select: { buses: true, drivers: true, users: true } },
          users: { where: { deletedAt: null }, select: { id: true, name: true, email: true }, take: 1 },
        },
        orderBy: [{ status: "asc" }, { isNational: "desc" }, { fleetSize: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.busCompany.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch {
    return { items: [], total: 0, page, pageSize, totalPages: 0 };
  }
}

export async function getPendingApplications() {
  await requireSuperAdmin();
  return db.busCompany.findMany({
    where: { ...excludeDeleted(), status: "PENDING" },
    include: {
      district: { include: { division: true } },
      _count: { select: { buses: true, drivers: true, users: true } },
      users: { where: { deletedAt: null }, select: { id: true, name: true, email: true } },
    },
    orderBy: { appliedAt: "asc" },
  });
}

export async function getCompanyStats() {
  if (!isDatabaseConfigured()) {
    return { total: 0, active: 0, national: 0, pending: 0, rejected: 0 };
  }
  try {
    const [total, active, national, pending, rejected] = await Promise.all([
      db.busCompany.count({ where: excludeDeleted() }),
      db.busCompany.count({ where: { ...excludeDeleted(), status: "ACTIVE" } }),
      db.busCompany.count({ where: { ...excludeDeleted(), isNational: true } }),
      db.busCompany.count({ where: { ...excludeDeleted(), status: "PENDING" } }),
      db.busCompany.count({ where: { ...excludeDeleted(), status: "REJECTED" } }),
    ]);
    return { total, active, national, pending, rejected };
  } catch {
    return { total: 0, active: 0, national: 0, pending: 0, rejected: 0 };
  }
}

export async function submitCompanyApplication(formData: FormData) {
  try {
    const raw = Object.fromEntries(formData);
    const parsed = companyApplicationSchema.safeParse({
      ...raw,
      fleetSize: raw.fleetSize || "5",
    });
    if (!parsed.success) return failure(parsed.error.errors[0].message);

    const data = parsed.data;
    const existingUser = await db.user.findUnique({ where: { email: data.contactEmail } });
    if (existingUser && !existingUser.deletedAt) {
      return failure("An account with this email already exists");
    }

    const existingCompany = await db.busCompany.findFirst({
      where: { email: data.companyEmail, deletedAt: null },
    });
    if (existingCompany) {
      return failure("A company with this email is already registered");
    }

    let code = slugifyCode(data.companyName);
    for (let i = 0; i < 5; i++) {
      const taken = await db.busCompany.findUnique({ where: { code } });
      if (!taken) break;
      code = slugifyCode(data.companyName);
    }

    const hashedPassword = await hashPassword(data.password);
    const userId = crypto.randomUUID();

    await db.$transaction(async (tx) => {
      const company = await tx.busCompany.create({
        data: {
          name: data.companyName,
          code,
          email: data.companyEmail,
          phone: data.companyPhone,
          address: data.companyAddress,
          website: data.website || null,
          districtId: data.districtId || null,
          fleetSize: data.fleetSize,
          contactName: data.contactName,
          status: "PENDING",
          appliedAt: new Date(),
        },
      });

      if (existingUser?.deletedAt) {
        await tx.user.update({
          where: { id: existingUser.id },
          data: {
            name: data.contactName,
            email: data.contactEmail,
            role: "MANAGER",
            companyId: company.id,
            emailVerified: true,
            deletedAt: null,
          },
        });
        const account = await tx.account.findFirst({
          where: { userId: existingUser.id, providerId: "credential" },
        });
        if (account) {
          await tx.account.update({ where: { id: account.id }, data: { password: hashedPassword } });
        }
      } else {
        await tx.user.create({
          data: {
            id: userId,
            name: data.contactName,
            email: data.contactEmail,
            emailVerified: true,
            role: "MANAGER",
            companyId: company.id,
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
      }
    });

    revalidateSystem();
    return success({ message: "Application submitted successfully" });
  } catch (error) {
    return failure(getErrorMessage(error));
  }
}

export async function createCompanyManual(formData: FormData) {
  try {
    const session = await requireSuperAdmin();
    const parsed = createCompanySchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return failure(parsed.error.errors[0].message);

    const data = parsed.data;
    const codeTaken = await db.busCompany.findUnique({ where: { code: data.code } });
    if (codeTaken) return failure("Company code already in use");

    const hashedPassword =
      data.managerEmail && data.managerPassword
        ? await hashPassword(data.managerPassword)
        : null;

    await db.$transaction(async (tx) => {
      const company = await tx.busCompany.create({
        data: {
          name: data.name,
          code: data.code.toUpperCase(),
          email: data.email || null,
          phone: data.phone || null,
          address: data.address || null,
          districtId: data.districtId || null,
          fleetSize: data.fleetSize,
          contactName: data.contactName || null,
          status: "ACTIVE",
          reviewedAt: new Date(),
          reviewedById: session.user.id,
        },
      });

      if (data.managerEmail && hashedPassword) {
        const existing = await db.user.findUnique({ where: { email: data.managerEmail } });
        if (existing && !existing.deletedAt) {
          throw new Error("Manager email already in use");
        }
        const userId = crypto.randomUUID();
        await tx.user.create({
          data: {
            id: userId,
            name: data.contactName || data.name,
            email: data.managerEmail,
            emailVerified: true,
            role: "MANAGER",
            companyId: company.id,
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
      }
    });

    revalidateSystem();
    return success(null);
  } catch (error) {
    return failure(getErrorMessage(error));
  }
}

export async function approveCompany(companyId: string) {
  try {
    const session = await requireSuperAdmin();
    const company = await db.busCompany.findFirst({
      where: { id: companyId, deletedAt: null, status: "PENDING" },
    });
    if (!company) return failure("Pending application not found");

    await db.busCompany.update({
      where: { id: companyId },
      data: {
        status: "ACTIVE",
        reviewedAt: new Date(),
        reviewedById: session.user.id,
        rejectionReason: null,
      },
    });

    revalidateSystem();
    return success(null);
  } catch (error) {
    return failure(getErrorMessage(error));
  }
}

export async function rejectCompany(formData: FormData) {
  try {
    const session = await requireSuperAdmin();
    const parsed = rejectCompanySchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return failure(parsed.error.errors[0].message);

    const { companyId, reason } = parsed.data;
    const company = await db.busCompany.findFirst({
      where: { id: companyId, deletedAt: null, status: "PENDING" },
    });
    if (!company) return failure("Pending application not found");

    await db.busCompany.update({
      where: { id: companyId },
      data: {
        status: "REJECTED",
        reviewedAt: new Date(),
        reviewedById: session.user.id,
        rejectionReason: reason,
      },
    });

    revalidateSystem();
    return success(null);
  } catch (error) {
    return failure(getErrorMessage(error));
  }
}

export async function getCompanyForUser(userId: string) {
  const user = await db.user.findFirst({
    where: { id: userId, deletedAt: null },
    include: { company: true },
  });
  return user?.company ?? null;
}
