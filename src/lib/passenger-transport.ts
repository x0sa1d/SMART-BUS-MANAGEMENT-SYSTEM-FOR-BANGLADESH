import type { Prisma } from "@prisma/client";
import type { BusCategory } from "@/types";
import { db, excludeDeleted, isDatabaseConfigured } from "@/lib/db";
import { calculateFare } from "@/lib/geo";
import { buildPassengerRouteFilter, addDaysUtc, formatDateKey } from "@/lib/district-search";
import { calendarDateKey, calendarTimeParts } from "@/lib/calendar-date";
import { materializeTripsFromSchedules } from "@/lib/trip-ensure";

/** Inclusive window: today + this many upcoming days (7 → 8 calendar days). */
export const PASSENGER_BROWSE_DAYS = 7;
export const ACTIVE_BOOKING_STATUSES = ["CONFIRMED", "PENDING"] as const;
export const ACTIVE_TRIP_STATUSES = ["SCHEDULED", "BOARDING"] as const;
export const BOOKABLE_BUS_STATUSES = ["ACTIVE", "AVAILABLE", "RUNNING"] as const;

export type { BusCategory };

const DAY_ABBREV = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function buildPassengerBusFilter(category: BusCategory): Prisma.BusWhereInput | undefined {
  if (category === "AC") {
    return { OR: [{ isAC: true }, { busType: { in: ["AC", "DELUXE"] } }] };
  }
  if (category === "NON_AC") {
    return { isAC: false, busType: { in: ["NON_AC", "STANDARD"] } };
  }
  return undefined;
}

export function isUpcomingDeparture(tripDate: Date, departureTime: string, now = new Date()): boolean {
  const tripKey = formatDateKey(tripDate);
  const todayKey = calendarDateKey(now);
  if (tripKey > todayKey) return true;
  if (tripKey < todayKey) return false;

  const [hours, minutes] = departureTime.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return true;

  const clock = calendarTimeParts(now);
  const departureMinutes = hours * 60 + minutes;
  const nowMinutes = clock.hours * 60 + clock.minutes;
  return departureMinutes > nowMinutes;
}

export function resolveTripFare(schedule: { fare: unknown; route: { distance: number } }): number {
  const stored = Number(schedule.fare);
  if (Number.isFinite(stored) && stored > 0) return stored;
  return calculateFare(schedule.route.distance);
}

const passengerTripIncludeDef = {
  schedule: {
    include: {
      route: {
        include: {
          sourceDistrict: { include: { division: true } },
          destinationDistrict: { include: { division: true } },
        },
      },
      bus: { include: { company: { select: { id: true, name: true } } } },
      driver: true,
    },
  },
  bus: {
    include: {
      company: { select: { id: true, name: true } },
      seats: {
        where: excludeDeleted(),
        orderBy: [{ row: "asc" as const }, { column: "asc" as const }],
      },
    },
  },
  bookings: {
    where: {
      deletedAt: null,
      status: { in: [...ACTIVE_BOOKING_STATUSES] },
    },
    select: { seatId: true },
  },
} satisfies Prisma.TripInclude;

type TripWithRelations = Prisma.TripGetPayload<{ include: typeof passengerTripIncludeDef }>;

export function passengerTripInclude(): Prisma.TripInclude {
  return passengerTripIncludeDef;
}

export function mapTripForPassenger(trip: TripWithRelations, now = new Date()) {
  if (!isUpcomingDeparture(trip.tripDate, trip.schedule.departureTime, now)) {
    return null;
  }

  const bookedSeatIds = new Set(trip.bookings.map((b) => b.seatId));
  const seats = trip.bus.seats.map((seat) => ({
    id: seat.id,
    seatNumber: seat.seatNumber,
    seatType: seat.seatType,
    row: seat.row,
    column: seat.column,
    isAvailable: !bookedSeatIds.has(seat.id),
  }));
  const availableCount = seats.filter((s) => s.isAvailable).length;
  const fare = resolveTripFare(trip.schedule);
  const company = trip.bus.company ?? trip.schedule.bus.company;

  return {
    id: trip.id,
    tripDate: trip.tripDate.toISOString(),
    status: trip.status,
    schedule: {
      departureTime: trip.schedule.departureTime,
      arrivalTime: trip.schedule.arrivalTime,
      fare,
      route: {
        name: trip.schedule.route.name,
        source: trip.schedule.route.source,
        destination: trip.schedule.route.destination,
        distance: trip.schedule.route.distance,
        estimatedDuration: trip.schedule.route.estimatedDuration,
      },
      bus: {
        busNumber: trip.schedule.bus.busNumber,
        busType: trip.schedule.bus.busType,
        isAC: trip.schedule.bus.isAC,
      },
      company: company ? { id: company.id, name: company.name } : null,
      driver: { fullName: trip.schedule.driver.fullName },
    },
    seats,
    availableCount,
    totalSeats: seats.length,
  };
}

export type PassengerTrip = NonNullable<ReturnType<typeof mapTripForPassenger>>;

export type FetchPassengerTripsParams = {
  destination: string;
  source?: string;
  dates: Date[];
  companyId?: string;
  busCategory?: BusCategory;
  now?: Date;
};

export async function fetchPassengerTrips({
  destination,
  source,
  dates,
  companyId,
  busCategory = "ALL",
  now = new Date(),
}: FetchPassengerTripsParams): Promise<PassengerTrip[]> {
  if (!isDatabaseConfigured()) return [];
  if (!destination || dates.length === 0) return [];

  try {
    const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());
    await materializeTripsFromSchedules(
      destination,
      sortedDates[0],
      sortedDates[sortedDates.length - 1],
      source
    );

    const routeFilter = buildPassengerRouteFilter(destination, source);
    const busFilter = buildPassengerBusFilter(busCategory);

    const rawTrips = await db.trip.findMany({
      where: {
        deletedAt: null,
        tripDate: dates.length === 1 ? dates[0] : { in: dates },
        status: { in: [...ACTIVE_TRIP_STATUSES] },
        schedule: {
          deletedAt: null,
          isActive: true,
          route: { ...routeFilter, isActive: true },
          bus: {
            deletedAt: null,
            status: { in: [...BOOKABLE_BUS_STATUSES] },
            ...(companyId ? { companyId } : {}),
            ...(busFilter ?? {}),
          },
        },
      },
      include: passengerTripIncludeDef,
      orderBy: [{ tripDate: "asc" }, { schedule: { departureTime: "asc" } }],
      take: 500,
    }) as TripWithRelations[];

    return rawTrips
      .map((trip) => mapTripForPassenger(trip, now))
      .filter((trip): trip is PassengerTrip => trip !== null);
  } catch (error) {
    console.error("fetchPassengerTrips failed");
    throw error;
  }
}

export function dayAbbrevForDate(date: Date): string {
  return DAY_ABBREV[date.getUTCDay()];
}

export function buildPassengerDateWindow(from: Date, days = PASSENGER_BROWSE_DAYS): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i <= days; i++) {
    dates.push(addDaysUtc(from, i));
  }
  return dates;
}
