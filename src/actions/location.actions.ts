"use server";

import { db, excludeDeleted, isDatabaseConfigured } from "@/lib/db";

export async function getDivisions() {
  if (!isDatabaseConfigured()) return [];
  try {
    return await db.division.findMany({
      include: {
        districts: {
          where: excludeDeleted(),
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });
  } catch {
    return [];
  }
}

export async function getDistricts(divisionId?: string) {
  if (!isDatabaseConfigured()) return [];
  try {
    return await db.district.findMany({
      where: {
        ...excludeDeleted(),
        ...(divisionId ? { divisionId } : {}),
      },
      include: { division: true },
      orderBy: { name: "asc" },
    });
  } catch {
    return [];
  }
}

export async function getDistrictById(id: string) {
  if (!isDatabaseConfigured()) return null;
  try {
    return await db.district.findFirst({
      where: { id, deletedAt: null },
      include: { division: true },
    });
  } catch {
    return null;
  }
}

export async function getLocationStats() {
  if (!isDatabaseConfigured()) {
    return { divisions: 0, districts: 0, routes: 0, stops: 0 };
  }
  try {
    const [divisions, districts, routes, stops] = await Promise.all([
      db.division.count(),
      db.district.count({ where: excludeDeleted() }),
      db.route.count({ where: excludeDeleted() }),
      db.stop.count({ where: excludeDeleted() }),
    ]);
    return { divisions, districts, routes, stops };
  } catch {
    return { divisions: 0, districts: 0, routes: 0, stops: 0 };
  }
}
