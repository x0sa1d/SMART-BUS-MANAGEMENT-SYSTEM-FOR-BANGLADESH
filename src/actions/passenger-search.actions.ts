"use server";

/**
 * Read-only passenger transport queries.
 * Uses the same Route / Schedule / Trip / Bus tables as Admin Route Management.
 * Passengers can view availability here; only booking actions write to the DB.
 */
import { unstable_noStore as noStore } from "next/cache";
import { addDaysUtc, formatDateKey } from "@/lib/district-search";
import { parseLocalDate } from "@/lib/utils";
import {
  fetchPassengerTrips,
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
    return { trips: [], requestedDate: date, usedFallback: false, fallbackDates: [] as string[] };
  }

  const dest = destination.trim();
  const now = new Date();
  const today = parseLocalDate(formatDateKey(now));
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

  if (trips.length === 0 && !isPastDate) {
    dates = [requestedDate];
    trips = await fetchPassengerTrips({ ...fetchParams, dates });
  }

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
  };
}
