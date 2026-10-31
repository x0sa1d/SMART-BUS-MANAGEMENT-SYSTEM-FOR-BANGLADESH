import { db, excludeDeleted } from "@/lib/db";
import { calculateFare, estimateDurationMinutes } from "@/lib/geo";
import type { BusType } from "@prisma/client";

export const BUSES_PER_ROUTE = 100;
export const MIN_BUSES_PER_ROUTE = Number(process.env.FLEET_MIN_BUSES || 10);
export const MAX_BUSES_PER_ROUTE = Number(process.env.FLEET_MAX_BUSES || 15);
/** Today + upcoming days (default 8 = today + 7 days). */
export const TRIP_DAYS = Number(process.env.FLEET_TRIP_DAYS || 8);
const BUS_CAPACITY = 36;
const BUS_TYPES: BusType[] = ["STANDARD", "DELUXE", "AC", "NON_AC"];

function targetBusesForRoute(routeId: string, min: number, max: number): number {
  const span = Math.max(0, max - min);
  let hash = 0;
  for (let i = 0; i < routeId.length; i++) {
    hash = (hash * 31 + routeId.charCodeAt(i)) >>> 0;
  }
  return min + (hash % (span + 1));
}

let globalBusSeq = 0;
let globalDriverSeq = 0;

function nextDepartureTime(slot: number): string {
  const totalMinutes = 5 * 60 + slot * 11;
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function arrivalFromDeparture(departure: string, durationMin: number): string {
  const [h, m] = departure.split(":").map(Number);
  const total = h * 60 + m + durationMin;
  const ah = Math.floor(total / 60) % 24;
  const am = total % 60;
  return `${String(ah).padStart(2, "0")}:${String(am).padStart(2, "0")}`;
}

async function ensureGlobalCounters() {
  const busCount = await db.bus.count();
  const driverCount = await db.driver.count();
  globalBusSeq = busCount;
  globalDriverSeq = driverCount;
}

async function createSeatsBatch(busIds: string[]) {
  const rows: {
    busId: string;
    seatNumber: string;
    row: number;
    column: number;
    seatType: "REGULAR";
  }[] = [];

  for (const busId of busIds) {
    for (let i = 0; i < BUS_CAPACITY; i++) {
      const row = Math.floor(i / 4) + 1;
      const col = (i % 4) + 1;
      rows.push({
        busId,
        seatNumber: `${row}${String.fromCharCode(64 + col)}`,
        row,
        column: col,
        seatType: "REGULAR",
      });
    }
  }

  for (let i = 0; i < rows.length; i += 2000) {
    await db.seat.createMany({ data: rows.slice(i, i + 2000), skipDuplicates: true });
  }
}

export async function seedRouteFleet(
  route: { id: string; distance: number; estimatedDuration: number },
  companies: { id: string }[],
  needed: number,
  companyOffset: number
) {
  const fare = calculateFare(route.distance);
  const baseDate = new Date();
  baseDate.setUTCHours(0, 0, 0, 0);

  const busRecords: {
    id: string;
    busNumber: string;
    registrationNumber: string;
    busType: BusType;
    capacity: number;
    isAC: boolean;
    companyId: string;
    status: "AVAILABLE";
  }[] = [];

  const driverRecords: {
    id: string;
    fullName: string;
    licenseNumber: string;
    phone: string;
    email: string;
    companyId: string;
  }[] = [];

  const busIds: string[] = [];
  const driverIds: string[] = [];

  for (let i = 0; i < needed; i++) {
    globalBusSeq++;
    globalDriverSeq++;
    const busId = crypto.randomUUID();
    const driverId = crypto.randomUUID();
    const company = companies[(companyOffset + i) % companies.length];
    const seq = globalBusSeq;

    busIds.push(busId);
    driverIds.push(driverId);

    busRecords.push({
      id: busId,
      busNumber: `SBM-F${String(seq).padStart(6, "0")}`,
      registrationNumber: `BD-FLEET-${String(seq).padStart(6, "0")}`,
      busType: BUS_TYPES[i % BUS_TYPES.length],
      capacity: BUS_CAPACITY,
      isAC: i % 3 !== 0,
      companyId: company.id,
      status: "AVAILABLE",
    });

    driverRecords.push({
      id: driverId,
      fullName: `Driver ${seq}`,
      licenseNumber: `DL-FLEET-${String(globalDriverSeq).padStart(7, "0")}`,
      phone: `+880 1700-${String(100000 + globalDriverSeq).slice(-6)}`,
      email: `driver${globalDriverSeq}@fleet.smartbus.com`,
      companyId: company.id,
    });
  }

  for (let i = 0; i < busRecords.length; i += 100) {
    await db.bus.createMany({ data: busRecords.slice(i, i + 100), skipDuplicates: true });
  }
  for (let i = 0; i < driverRecords.length; i += 100) {
    await db.driver.createMany({ data: driverRecords.slice(i, i + 100), skipDuplicates: true });
  }

  await createSeatsBatch(busIds);

  for (let i = 0; i < needed; i++) {
    const departure = nextDepartureTime(i);
    const arrival = arrivalFromDeparture(departure, route.estimatedDuration || estimateDurationMinutes(route.distance));

    const schedule = await db.schedule.create({
      data: {
        routeId: route.id,
        busId: busIds[i],
        driverId: driverIds[i],
        departureTime: departure,
        arrivalTime: arrival,
        fare,
        daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        isActive: true,
      },
    });

    const tripRows = [];
    for (let dayOffset = 0; dayOffset < TRIP_DAYS; dayOffset++) {
      const tripDate = new Date(baseDate);
      tripDate.setUTCDate(tripDate.getUTCDate() + dayOffset);
      tripRows.push({
        scheduleId: schedule.id,
        busId: busIds[i],
        driverId: driverIds[i],
        tripDate,
        status: "SCHEDULED" as const,
      });
    }
    await db.trip.createMany({ data: tripRows, skipDuplicates: true });
  }
}

export async function seedFleet(busesPerRoute = BUSES_PER_ROUTE) {
  console.log(`Seeding fleet: ${busesPerRoute} buses per route...`);
  await ensureGlobalCounters();

  const [routes, companies] = await Promise.all([
    db.route.findMany({
      where: { deletedAt: null, isActive: true },
      select: { id: true, distance: true, estimatedDuration: true, name: true },
    }),
    db.busCompany.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      select: { id: true },
    }),
  ]);

  if (companies.length === 0) {
    console.warn("No active companies — run seedBusCompanies first");
    return;
  }

  let routesProcessed = 0;
  let busesCreated = 0;

  for (const route of routes) {
    const existingSchedules = await db.schedule.count({
      where: { routeId: route.id, deletedAt: null },
    });

    const needed = busesPerRoute - existingSchedules;
    if (needed <= 0) continue;

    await seedRouteFleet(route, companies, needed, routesProcessed * busesPerRoute);
    routesProcessed++;
    busesCreated += needed;

    if (routesProcessed % 10 === 0) {
      console.log(`  Fleet progress: ${routesProcessed} routes, ${busesCreated} buses added...`);
    }
  }

  console.log(`Fleet seed complete: ${routesProcessed} routes updated, ${busesCreated} buses added`);
}

/** Ensure each active route has between min and max buses (deterministic per route) and trips for TRIP_DAYS. */
export async function seedWeeklyFleetPerRoute(
  minBuses = MIN_BUSES_PER_ROUTE,
  maxBuses = MAX_BUSES_PER_ROUTE
) {
  console.log(
    `Weekly fleet: ${minBuses}-${maxBuses} buses per route, ${TRIP_DAYS} day trip window...`
  );
  await ensureGlobalCounters();

  const [routes, companies] = await Promise.all([
    db.route.findMany({
      where: { deletedAt: null, isActive: true },
      select: { id: true, distance: true, estimatedDuration: true, name: true },
    }),
    db.busCompany.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      select: { id: true },
    }),
  ]);

  if (companies.length === 0) {
    console.warn("No active companies — run seedBusCompanies first");
    return;
  }

  let routesProcessed = 0;
  let busesCreated = 0;

  for (const route of routes) {
    const existingSchedules = await db.schedule.count({
      where: { routeId: route.id, deletedAt: null },
    });

    const target = targetBusesForRoute(route.id, minBuses, maxBuses);
    const needed = Math.max(0, target - existingSchedules);
    if (needed <= 0) {
      routesProcessed++;
      continue;
    }

    await seedRouteFleet(route, companies, needed, routesProcessed * target);
    routesProcessed++;
    busesCreated += needed;

    if (routesProcessed % 25 === 0) {
      console.log(`  Weekly fleet: ${routesProcessed}/${routes.length} routes, ${busesCreated} buses added...`);
    }
  }

  console.log(
    `Weekly fleet complete: ${routesProcessed} routes checked, ${busesCreated} buses added`
  );
}

export async function refreshScheduleFares() {
  const routes = await db.route.findMany({ where: excludeDeleted(), select: { id: true, distance: true } });
  for (const route of routes) {
    const fare = calculateFare(route.distance);
    await db.schedule.updateMany({
      where: { routeId: route.id, deletedAt: null },
      data: { fare },
    });
  }
  console.log(`Updated fares for ${routes.length} routes at 3 BDT/km`);
}
