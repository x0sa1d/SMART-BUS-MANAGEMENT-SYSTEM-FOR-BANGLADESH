import { db } from "@/lib/db";

const UPAZILA_SUFFIXES = ["Sadar", "City", "Pourashava", "Upazila"];

export async function seedUpazilas() {
  const existing = await db.upazila.count();
  if (existing > 100) {
    console.log(`Upazilas already seeded (${existing})`);
    return;
  }

  const districts = await db.district.findMany({
    where: { deletedAt: null },
    include: { division: true },
  });

  const data: Array<{
    name: string;
    nameBn: string;
    code: string;
    districtId: string;
    latitude?: number;
    longitude?: number;
  }> = [];

  districts.forEach((district, dIdx) => {
    UPAZILA_SUFFIXES.forEach((suffix, uIdx) => {
      const code = `${district.code}-${String(uIdx + 1).padStart(2, "0")}`;
      data.push({
        name: `${district.name} ${suffix}`,
        nameBn: `${district.nameBn || district.name} ${suffix}`,
        code,
        districtId: district.id,
        latitude: district.latitude ? district.latitude + (uIdx * 0.05) : undefined,
        longitude: district.longitude ? district.longitude + (uIdx * 0.05) : undefined,
      });
    });

    if (dIdx % 8 === 0) {
      data.push({
        name: `${district.name} Tourist Hub`,
        nameBn: `${district.nameBn || district.name} Tourist Hub`,
        code: `${district.code}-TH`,
        districtId: district.id,
        latitude: district.latitude ?? undefined,
        longitude: district.longitude ?? undefined,
      });
    }
  });

  await db.upazila.createMany({ data, skipDuplicates: true });
  console.log(`Seeded ${data.length} upazilas across ${districts.length} districts`);
}

export async function upgradeTerminalStops() {
  const terminals = await db.stop.findMany({
    where: { deletedAt: null, name: { contains: "Terminal" } },
  });

  for (const stop of terminals) {
    const upazila = stop.districtId
      ? await db.upazila.findFirst({ where: { districtId: stop.districtId, name: { contains: "Sadar" } } })
      : null;

    await db.stop.update({
      where: { id: stop.id },
      data: {
        isTerminal: true,
        stopType: "TERMINAL",
        upazilaId: upazila?.id,
      },
    });
  }

  const touristStops = await db.stop.findMany({
    where: { deletedAt: null, OR: [{ name: { contains: "Cox" } }, { name: { contains: "Saint Martin" } }] },
  });

  for (const stop of touristStops) {
    await db.stop.update({
      where: { id: stop.id },
      data: { stopType: "TOURIST", isTerminal: true },
    });
  }
}
