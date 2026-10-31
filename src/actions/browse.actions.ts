"use server";

import { db, excludeDeleted } from "@/lib/db";
import { calculateFare } from "@/lib/geo";
import { buildPassengerRouteFilter, formatDateKey } from "@/lib/district-search";
import { calendarDateKey } from "@/lib/calendar-date";
import { parseLocalDate } from "@/lib/utils";
import {
  buildPassengerDateWindow,
  fetchPassengerTrips,
  PASSENGER_BROWSE_DAYS,
} from "@/lib/passenger-transport";
import type { BusCategory } from "@/types";

/** Read-only view of routes, schedules, and availability synced with Admin Management. */
export async function browseTransportNetwork(
  destination?: string,
  source?: string,
  busCategory: BusCategory = "ALL"
) {
  const now = new Date();
  const today = parseLocalDate(calendarDateKey(now));
  const endDate = buildPassengerDateWindow(today, PASSENGER_BROWSE_DAYS).at(-1)!;
  const dest = destination?.trim();

  const [routes, districts, companies, schedules] = await Promise.all([
    db.route.findMany({
      where: dest
        ? { ...buildPassengerRouteFilter(dest, source?.trim() || undefined), isActive: true }
        : { ...excludeDeleted(), isActive: true },
      select: {
        id: true,
        name: true,
        source: true,
        destination: true,
        distance: true,
        estimatedDuration: true,
        isActive: true,
      },
      orderBy: { name: "asc" },
      take: dest ? 100 : 100,
    }),
    db.district.findMany({
      where: excludeDeleted(),
      select: { id: true, name: true, isHub: true },
      orderBy: { name: "asc" },
    }),
    db.busCompany.findMany({
      where: { ...excludeDeleted(), status: "ACTIVE" },
      select: { id: true, name: true, rating: true },
      orderBy: { name: "asc" },
      take: 50,
    }),
    dest
      ? fetchPassengerTrips({
          destination: dest,
          source: source?.trim() || undefined,
          dates: buildPassengerDateWindow(today, PASSENGER_BROWSE_DAYS),
          busCategory,
          now,
        }).catch(() => [])
      : Promise.resolve([]),
  ]);

  const dates = buildPassengerDateWindow(today, PASSENGER_BROWSE_DAYS).map(formatDateKey);

  return {
    dateRange: { from: formatDateKey(today), to: formatDateKey(endDate), days: dates },
    routes: routes.map((r) => ({ ...r, fare: calculateFare(r.distance) })),
    destinations: districts,
    companies,
    schedules: schedules.map((s) => ({
      tripId: s.id,
      date: s.tripDate.slice(0, 10),
      departureTime: s.schedule.departureTime,
      arrivalTime: s.schedule.arrivalTime,
      route: s.schedule.route.name,
      source: s.schedule.route.source,
      destination: s.schedule.route.destination,
      distance: s.schedule.route.distance,
      fare: s.schedule.fare,
      busNumber: s.schedule.bus.busNumber,
      busType: s.schedule.bus.busType,
      isAC: s.schedule.bus.isAC,
      companyName: s.schedule.company?.name ?? null,
      availableSeats: s.availableCount,
      totalSeats: s.totalSeats,
    })),
  };
}
