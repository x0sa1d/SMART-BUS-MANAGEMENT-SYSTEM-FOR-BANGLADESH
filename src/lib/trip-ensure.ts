import { db, isDatabaseConfigured } from "@/lib/db";
import { buildPassengerRouteFilter, addDaysUtc, formatDateKey } from "@/lib/district-search";

const LEGACY_DESTINATION_NAMES: Record<string, string> = {
  Chittagong: "Chattogram",
  Comilla: "Cumilla",
  Jessore: "Jashore",
  Barisal: "Barishal",
  Bogra: "Bogura",
};

const DAY_ABBREV = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export async function normalizeLegacyRouteNames() {
  if (!isDatabaseConfigured()) return;
  for (const [legacy, current] of Object.entries(LEGACY_DESTINATION_NAMES)) {
    await db.route.updateMany({
      where: { destination: legacy, deletedAt: null },
      data: { destination: current },
    });
    await db.route.updateMany({
      where: { source: legacy, deletedAt: null },
      data: { source: current },
    });
  }
}

function scheduleRunsOnDate(daysOfWeek: string[], date: Date): boolean {
  if (daysOfWeek.length === 0) return true;
  return daysOfWeek.includes(DAY_ABBREV[date.getUTCDay()]);
}

/** Materialize trip rows from admin-managed schedules only (read-side sync). */
export async function materializeTripsFromSchedules(
  destination: string,
  startDate: Date,
  endDate: Date,
  source?: string
) {
  if (!isDatabaseConfigured()) return;

  try {
    await normalizeLegacyRouteNames();

    const routes = await db.route.findMany({
      where: { ...buildPassengerRouteFilter(destination, source), isActive: true },
      select: { id: true },
    });
    if (routes.length === 0) return;

    const routeIds = routes.map((r) => r.id);
    const schedules = await db.schedule.findMany({
      where: {
        routeId: { in: routeIds },
        deletedAt: null,
        isActive: true,
        bus: { deletedAt: null, status: { in: ["ACTIVE", "AVAILABLE", "RUNNING"] } },
      },
      select: { id: true, busId: true, driverId: true, daysOfWeek: true },
    });
    if (schedules.length === 0) return;

    const existingTrips = await db.trip.findMany({
      where: {
        deletedAt: null,
        scheduleId: { in: schedules.map((s) => s.id) },
        tripDate: { gte: startDate, lte: endDate },
      },
      select: { scheduleId: true, tripDate: true },
    });

    const existingKeys = new Set(
      existingTrips.map((t) => `${t.scheduleId}:${formatDateKey(t.tripDate)}`)
    );

    const toCreate: {
      scheduleId: string;
      busId: string;
      driverId: string;
      tripDate: Date;
      status: "SCHEDULED";
    }[] = [];

    for (let d = new Date(startDate); d <= endDate; d = addDaysUtc(d, 1)) {
      for (const schedule of schedules) {
        if (!scheduleRunsOnDate(schedule.daysOfWeek, d)) continue;
        const key = `${schedule.id}:${formatDateKey(d)}`;
        if (existingKeys.has(key)) continue;
        toCreate.push({
          scheduleId: schedule.id,
          busId: schedule.busId,
          driverId: schedule.driverId,
          tripDate: new Date(d),
          status: "SCHEDULED",
        });
      }
    }

    for (let i = 0; i < toCreate.length; i += 500) {
      await db.trip.createMany({ data: toCreate.slice(i, i + 500), skipDuplicates: true });
    }
  } catch {
    // Soft-fail when DB is unreachable / misconfigured
  }
}

/** @deprecated Use materializeTripsFromSchedules */
export async function ensureTripsForSearchWindow(
  destination: string,
  startDate: Date,
  endDate: Date,
  source?: string
) {
  return materializeTripsFromSchedules(destination, startDate, endDate, source);
}

/** Materialize trips for all active schedules across every route in the date window. */
export async function materializeAllTripsInWindow(startDate: Date, endDate: Date) {
  if (!isDatabaseConfigured()) return;

  const schedules = await db.schedule.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      route: { deletedAt: null, isActive: true },
      bus: { deletedAt: null, status: { in: ["ACTIVE", "AVAILABLE", "RUNNING"] } },
    },
    select: { id: true, busId: true, driverId: true, daysOfWeek: true },
  });
  if (schedules.length === 0) return;

  const existingTrips = await db.trip.findMany({
    where: {
      deletedAt: null,
      scheduleId: { in: schedules.map((s) => s.id) },
      tripDate: { gte: startDate, lte: endDate },
    },
    select: { scheduleId: true, tripDate: true },
  });

  const existingKeys = new Set(
    existingTrips.map((t) => `${t.scheduleId}:${formatDateKey(t.tripDate)}`)
  );

  const toCreate: {
    scheduleId: string;
    busId: string;
    driverId: string;
    tripDate: Date;
    status: "SCHEDULED";
  }[] = [];

  for (let d = new Date(startDate); d <= endDate; d = addDaysUtc(d, 1)) {
    for (const schedule of schedules) {
      if (!scheduleRunsOnDate(schedule.daysOfWeek, d)) continue;
      const key = `${schedule.id}:${formatDateKey(d)}`;
      if (existingKeys.has(key)) continue;
      toCreate.push({
        scheduleId: schedule.id,
        busId: schedule.busId,
        driverId: schedule.driverId,
        tripDate: new Date(d),
        status: "SCHEDULED",
      });
    }
  }

  for (let i = 0; i < toCreate.length; i += 500) {
    await db.trip.createMany({ data: toCreate.slice(i, i + 500), skipDuplicates: true });
  }

  console.log(`Materialized ${toCreate.length} trip rows (${formatDateKey(startDate)} → ${formatDateKey(endDate)})`);
}
