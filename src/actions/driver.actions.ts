"use server";

import { revalidateSystem } from "@/lib/revalidate-system";
import { db, excludeDeleted } from "@/lib/db";
import { requireWriteAccess, getDashboardAccess } from "@/lib/auth-server";
import { companyDriverFilter } from "@/lib/access-scope";
import { success, failure, getErrorMessage } from "@/lib/action-utils";
import { driverSchema } from "@/schemas";

export async function getDrivers() {
  const access = await getDashboardAccess();
  return db.driver.findMany({
    where: companyDriverFilter(access),
    include: { _count: { select: { buses: true, trips: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createDriver(formData: FormData) {
  try {
    const access = await requireWriteAccess();
    const parsed = driverSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return failure(parsed.error.errors[0].message);
    const driver = await db.driver.create({
      data: {
        ...parsed.data,
        ...(access.companyId ? { companyId: access.companyId } : {}),
      },
    });
    revalidateSystem();
    return success(driver);
  } catch (error) {
    return failure(getErrorMessage(error));
  }
}

export async function updateDriver(id: string, formData: FormData) {
  try {
    const access = await requireWriteAccess();
    const existing = await db.driver.findFirst({ where: { id, ...companyDriverFilter(access) } });
    if (!existing) return failure("Driver not found");
    const parsed = driverSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return failure(parsed.error.errors[0].message);
    const driver = await db.driver.update({ where: { id }, data: parsed.data });
    revalidateSystem();
    return success(driver);
  } catch (error) {
    return failure(getErrorMessage(error));
  }
}

export async function deleteDriver(id: string) {
  try {
    const access = await requireWriteAccess();
    const existing = await db.driver.findFirst({ where: { id, ...companyDriverFilter(access) } });
    if (!existing) return failure("Driver not found");
    await db.driver.update({ where: { id }, data: { deletedAt: new Date() } });
    revalidateSystem();
    return success(null);
  } catch (error) {
    return failure(getErrorMessage(error));
  }
}
