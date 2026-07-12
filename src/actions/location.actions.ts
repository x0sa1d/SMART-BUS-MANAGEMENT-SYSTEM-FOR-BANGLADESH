"use server";

import { unstable_cache } from "next/cache";
import { db, excludeDeleted } from "@/lib/db";

async function fetchDivisions() {
  return db.division.findMany({
    include: {
      districts: {
        where: excludeDeleted(),
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
}

const getCachedDivisions = unstable_cache(fetchDivisions, ["bangladesh-divisions"], {
  revalidate: 3600,
  tags: ["locations"],
});

export async function getDivisions() {
  return getCachedDivisions();
}

export async function getDistricts(divisionId?: string) {
  return db.district.findMany({
    where: {
      ...excludeDeleted(),
      ...(divisionId ? { divisionId } : {}),
    },
    include: { division: true },
    orderBy: { name: "asc" },
  });
}

export async function getDistrictById(id: string) {
  return db.district.findFirst({
    where: { id, deletedAt: null },
    include: { division: true },
  });
}

export async function getLocationStats() {
  const [divisions, districts, routes, stops] = await Promise.all([
    db.division.count(),
    db.district.count({ where: excludeDeleted() }),
    db.route.count({ where: excludeDeleted() }),
    db.stop.count({ where: excludeDeleted() }),
  ]);
  return { divisions, districts, routes, stops };
}
