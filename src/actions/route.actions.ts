"use server";

import { revalidateSystem } from "@/lib/revalidate-system";
import { db, excludeDeleted } from "@/lib/db";
import { requirePlatformWrite } from "@/lib/auth-server";
import { success, failure, getErrorMessage } from "@/lib/action-utils";
import { routeSchema } from "@/schemas";

export async function getRoutes() {
  return db.route.findMany({
    where: excludeDeleted(),
    include: {
      sourceDistrict: { include: { division: true } },
      destinationDistrict: { include: { division: true } },
      _count: { select: { schedules: true, stops: true } },
    },
    orderBy: { source: "asc" },
  });
}

export async function createRoute(formData: FormData) {
  try {
    await requirePlatformWrite();
    const parsed = routeSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return failure(parsed.error.errors[0].message);
    const route = await db.route.create({ data: parsed.data });
    revalidateSystem();
    return success(route);
  } catch (error) {
    return failure(getErrorMessage(error));
  }
}

export async function updateRoute(id: string, formData: FormData) {
  try {
    await requirePlatformWrite();
    const parsed = routeSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return failure(parsed.error.errors[0].message);
    const route = await db.route.update({ where: { id }, data: parsed.data });
    revalidateSystem();
    return success(route);
  } catch (error) {
    return failure(getErrorMessage(error));
  }
}

export async function deleteRoute(id: string) {
  try {
    await requirePlatformWrite();
    await db.route.update({ where: { id }, data: { deletedAt: new Date() } });
    revalidateSystem();
    return success(null);
  } catch (error) {
    return failure(getErrorMessage(error));
  }
}
