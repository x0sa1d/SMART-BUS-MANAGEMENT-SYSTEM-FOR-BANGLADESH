"use server";

/**
 * Read-only passenger transport queries.
 * Uses the same Route / Schedule / Trip / Bus tables as Admin Route Management.
 * Passengers can view availability here; only booking actions write to the DB.
 */
import { unstable_noStore as noStore } from "next/cache";
import { addDaysUtc, formatDateKey, isSameCity } from "@/lib/district-search";
import { calendarDateKey } from "@/lib/calendar-date";
import { parseLocalDate } from "@/lib/utils";
import { isDatabaseConfigured } from "@/lib/db";
import {
  fetchPassengerTrips,
  fetchPassengerTripSeats,
  PASSENGER_BROWSE_DAYS,
} from "@/lib/passenger-transport";
import type { BusCategory } from "@/types";

export type SearchAvailableBusesParams = {
  destination: string;
  date: string;
  source?: string;
  companyId?: string;
  busCategory?: BusCategory;
};

export async function searchAvailableBuses({
  destination,
  date,
  source,
  companyId,
  busCategory = "ALL",
}: SearchAvailableBusesParams) {
  noStore();
  if (!destination?.trim() || !date) {
    return { trips: [], requestedDate: date, usedFallback: false, fallbackDates: [] as string[], error: null };
  }

  if (source?.trim() && isSameCity(source, destination)) {
    return { trips: [], requestedDate: date, usedFallback: false, fallbackDates: [] as string[], error: null };
  }

  if (!isDatabaseConfigured()) {
    return {
      trips: [],
      requestedDate: date,
      usedFallback: false,
      fallbackDates: [] as string[],
      error: "unavailable" as const,
    };
  }

  try {
    const dest = destination.trim();
    const now = new Date();
    const today = parseLocalDate(calendarDateKey(now));
    const requestedDate = parseLocalDate(date);
    const isPastDate = requestedDate < today;

    let usedFallback = false;
    const fallbackDates: string[] = [];

    const fetchParams = {
      destination: dest,
      source: source?.trim() || undefined,
      companyId,
      busCategory,
      now,
    };

    let dates = !isPastDate ? [requestedDate] : [];
    let trips =
      dates.length > 0 ? await fetchPassengerTrips({ ...fetchParams, dates }) : [];

    if (trips.length === 0) {
      usedFallback = true;
      const startFallback = isPastDate ? today : addDaysUtc(requestedDate, 1);
      dates = [];
      for (let i = 0; i < PASSENGER_BROWSE_DAYS; i++) {
        dates.push(addDaysUtc(startFallback, i));
      }
      trips = await fetchPassengerTrips({ ...fetchParams, dates });
      fallbackDates.push(...dates.map(formatDateKey));
    }

    return {
      trips,
      requestedDate: formatDateKey(requestedDate),
      usedFallback: usedFallback || isPastDate,
      fallbackDates,
      error: null,
    };
  } catch {
    return {
      trips: [],
      requestedDate: date,
      usedFallback: false,
      fallbackDates: [] as string[],
      error: "unavailable" as const,
    };
  }
}

export async function getPassengerTripSeats(tripId: string) {
  noStore();
  if (!tripId || !isDatabaseConfigured()) return [];
  try {
    return await fetchPassengerTripSeats(tripId);
  } catch {
    return [];
  }
}
