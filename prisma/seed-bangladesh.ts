import { db, excludeDeleted } from "@/lib/db";
import { BANGLADESH_DIVISIONS, ALL_DISTRICTS } from "@/constants/bangladesh";
import { estimateRoadDistanceKm, estimateDurationMinutes, calculateFare } from "@/lib/geo";

export async function seedBangladeshLocations() {
  console.log("Seeding 8 divisions and 64 districts...");

  for (const div of BANGLADESH_DIVISIONS) {
    const division = await db.division.upsert({
      where: { code: div.code },
      update: { name: div.name, nameBn: div.nameBn },
      create: { code: div.code, name: div.name, nameBn: div.nameBn },
    });

    for (const dist of div.districts) {
      await db.district.upsert({
        where: { code: dist.code },
        update: {
          name: dist.name,
          nameBn: dist.nameBn,
          latitude: dist.latitude,
          longitude: dist.longitude,
          isHub: dist.isHub ?? false,
          divisionId: division.id,
        },
        create: {
          code: dist.code,
          name: dist.name,
          nameBn: dist.nameBn,
          latitude: dist.latitude,
          longitude: dist.longitude,
          isHub: dist.isHub ?? false,
          divisionId: division.id,
        },
      });
    }
  }

  console.log(`Seeded ${BANGLADESH_DIVISIONS.length} divisions, ${ALL_DISTRICTS.length} districts`);
}

export async function seedBangladeshRoutes() {
  console.log("Generating routes for all district pairs (Dhaka hub + division hubs)...");

  const districts = await db.district.findMany({ where: { deletedAt: null } });
  const dhaka = districts.find((d) => d.code === "DHAKA");
  if (!dhaka) throw new Error("Dhaka district not found");

  const hubs = districts.filter((d) => d.isHub);
  let created = 0;

  async function upsertRoute(
    from: (typeof districts)[0],
    to: (typeof districts)[0]
  ) {
    if (from.id === to.id) return;
    const distance = estimateRoadDistanceKm(
      from.latitude ?? 0,
      from.longitude ?? 0,
      to.latitude ?? 0,
      to.longitude ?? 0
    );
    const duration = estimateDurationMinutes(distance);
    const name = `${from.name} → ${to.name}`;

    await db.route.upsert({
      where: {
        sourceDistrictId_destinationDistrictId: {
          sourceDistrictId: from.id,
          destinationDistrictId: to.id,
        },
      },
      update: {
        name,
        source: from.name,
        destination: to.name,
        distance,
        estimatedDuration: duration,
        isActive: true,
        deletedAt: null,
      },
      create: {
        name,
        source: from.name,
        destination: to.name,
        sourceDistrictId: from.id,
        destinationDistrictId: to.id,
        distance,
        estimatedDuration: duration,
        isActive: true,
      },
    });
    created++;
  }

  // Dhaka ↔ all other 63 districts (both directions)
  for (const dist of districts) {
    if (dist.id !== dhaka.id) {
      await upsertRoute(dhaka, dist);
      await upsertRoute(dist, dhaka);
    }
  }

  // Division hub ↔ division hub (inter-division connectivity)
  for (let i = 0; i < hubs.length; i++) {
    for (let j = i + 1; j < hubs.length; j++) {
      await upsertRoute(hubs[i], hubs[j]);
      await upsertRoute(hubs[j], hubs[i]);
    }
  }

  // Each district ↔ its division hub (if not hub itself)
  for (const dist of districts) {
    if (dist.isHub) continue;
    const hub = hubs.find((h) => h.divisionId === dist.divisionId);
    if (hub && hub.id !== dist.id) {
      await upsertRoute(dist, hub);
      await upsertRoute(hub, dist);
    }
  }

  console.log(`Upserted ${created}+ routes across Bangladesh`);
}

export async function seedDistrictStops() {
  const districts = await db.district.findMany({ where: { deletedAt: null } });
  for (const dist of districts) {
    const stopName = `${dist.name} Bus Terminal`;
    const existing = await db.stop.findFirst({
      where: { name: stopName, deletedAt: null },
    });
    if (!existing) {
      await db.stop.create({
        data: {
          name: stopName,
          city: dist.name,
          districtId: dist.id,
          latitude: dist.latitude,
          longitude: dist.longitude,
        },
      });
    }
  }
  console.log("Seeded bus terminal stops for all districts");
}

export async function seedSampleSchedulesAndTrips() {
  const buses = await db.bus.findMany({ where: excludeDeleted(), take: 5 });
  const drivers = await db.driver.findMany({ where: excludeDeleted(), take: 5 });
  if (buses.length === 0 || drivers.length === 0) return;

  const popularRoutes = await db.route.findMany({
    where: {
      deletedAt: null,
      OR: [
        { source: "Dhaka", destination: "Chattogram" },
        { source: "Chattogram", destination: "Dhaka" },
        { source: "Dhaka" },
        { destination: "Dhaka" },
        { source: "Chattogram" },
        { destination: "Chattogram" },
      ],
    },
    take: 30,
  });

  const baseDate = new Date();
  baseDate.setUTCHours(0, 0, 0, 0);

  let i = 0;
  for (const route of popularRoutes) {
    const bus = buses[i % buses.length];
    const driver = drivers[i % drivers.length];
    const fare = calculateFare(route.distance);

    let schedule = await db.schedule.findFirst({
      where: { routeId: route.id, busId: bus.id, deletedAt: null },
    });
    if (!schedule) {
      schedule = await db.schedule.create({
        data: {
          routeId: route.id,
          busId: bus.id,
          driverId: driver.id,
          departureTime: i % 2 === 0 ? "06:00" : "14:00",
          arrivalTime: i % 2 === 0 ? "12:00" : "20:00",
          fare,
          daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          isActive: true,
        },
      });
    }

    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const tripDate = new Date(baseDate);
      tripDate.setUTCDate(tripDate.getUTCDate() + dayOffset);

      const existingTrip = await db.trip.findFirst({
        where: { scheduleId: schedule.id, tripDate, deletedAt: null },
      });
      if (!existingTrip) {
        await db.trip.create({
          data: {
            scheduleId: schedule.id,
            busId: bus.id,
            driverId: driver.id,
            tripDate,
            status: "SCHEDULED",
          },
        });
      }
    }
    i++;
  }
  console.log(`Seeded ${popularRoutes.length} schedules with 14 days of trips`);
}
