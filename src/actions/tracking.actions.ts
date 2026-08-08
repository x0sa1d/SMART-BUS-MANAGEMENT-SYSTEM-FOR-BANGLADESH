"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession, requireAuth, requireDriver, requireManager } from "@/lib/auth-server";
import { getRoleFromUser } from "@/lib/permissions";
import { predictDelay } from "@/lib/delay-prediction";
import { success, failure } from "@/lib/action-utils";

export async function updateTripLocation(input: {
  tripId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
}) {
  try {
    const session = await requireDriver();
    const driver = await db.driver.findFirst({
      where: { userId: session.user.id, deletedAt: null },
    });

    const trip = await db.trip.findFirst({
      where: { id: input.tripId, deletedAt: null },
      include: {
        schedule: {
          include: {
            route: {
              include: {
                sourceDistrict: true,
                destinationDistrict: true,
              },
            },
          },
        },
      },
    });

    if (!trip) return failure("Trip not found");
    if (driver && trip.driverId !== driver.id && getRoleFromUser(session.user) === "DRIVER") {
      return failure("Not your assigned trip");
    }

    const prediction = predictDelay({
      tripDate: trip.tripDate,
      departureTime: trip.schedule.departureTime,
      arrivalTime: trip.schedule.arrivalTime,
      estimatedDurationMinutes: trip.schedule.route.estimatedDuration,
      distanceKm: trip.schedule.route.distance,
      status: trip.status,
      startedAt: trip.startedAt,
      currentLat: input.latitude,
      currentLng: input.longitude,
      sourceLat: trip.schedule.route.sourceDistrict?.latitude,
      sourceLng: trip.schedule.route.sourceDistrict?.longitude,
      destLat: trip.schedule.route.destinationDistrict?.latitude,
      destLng: trip.schedule.route.destinationDistrict?.longitude,
    });

    const nextStatus =
      trip.status === "SCHEDULED" || trip.status === "BOARDING"
        ? "IN_TRANSIT"
        : prediction.predictedDelayMinutes >= 20 && trip.status === "IN_TRANSIT"
          ? "DELAYED"
          : trip.status;

    await db.$transaction([
      db.tripLocation.create({
        data: {
          tripId: trip.id,
          latitude: input.latitude,
          longitude: input.longitude,
          speed: input.speed,
          heading: input.heading,
        },
      }),
      db.trip.update({
        where: { id: trip.id },
        data: {
          currentLat: input.latitude,
          currentLng: input.longitude,
          eta: prediction.eta,
          predictedDelayMinutes: prediction.predictedDelayMinutes,
          delayReason: prediction.reason,
          delayUpdatedAt: new Date(),
          status: nextStatus as never,
          startedAt: trip.startedAt ?? new Date(),
        },
      }),
      db.bus.update({
        where: { id: trip.busId },
        data: {
          currentLat: input.latitude,
          currentLng: input.longitude,
          lastLocationUpdate: new Date(),
          status: "RUNNING",
        },
      }),
    ]);

    revalidatePath("/passenger/track");
    revalidatePath("/driver");
    revalidatePath("/driver/trips");
    return success({ prediction, message: "Location updated" });
  } catch (e) {
    console.error(e);
    return failure("Failed to update location");
  }
}

export async function getTrackableTripsForPassenger() {
  const session = await getSession();
  if (!session) return [];

  const passenger = await db.passenger.findFirst({
    where: { userId: session.user.id, deletedAt: null },
  });
  if (!passenger) return [];

  const bookings = await db.booking.findMany({
    where: {
      passengerId: passenger.id,
      deletedAt: null,
      status: { in: ["CONFIRMED", "PENDING"] },
      trip: {
        deletedAt: null,
        status: { in: ["SCHEDULED", "BOARDING", "IN_TRANSIT", "DELAYED"] },
      },
    },
    include: {
      trip: {
        include: {
          schedule: { include: { route: { include: { sourceDistrict: true, destinationDistrict: true } } } },
          bus: true,
          driver: true,
          locations: { orderBy: { recordedAt: "desc" }, take: 40 },
        },
      },
      seat: true,
    },
    orderBy: { bookedAt: "desc" },
    take: 20,
  });

  return bookings.map((b) => {
    const prediction = predictDelay({
      tripDate: b.trip.tripDate,
      departureTime: b.trip.schedule.departureTime,
      arrivalTime: b.trip.schedule.arrivalTime,
      estimatedDurationMinutes: b.trip.schedule.route.estimatedDuration,
      distanceKm: b.trip.schedule.route.distance,
      status: b.trip.status,
      startedAt: b.trip.startedAt,
      currentLat: b.trip.currentLat,
      currentLng: b.trip.currentLng,
      sourceLat: b.trip.schedule.route.sourceDistrict?.latitude,
      sourceLng: b.trip.schedule.route.sourceDistrict?.longitude,
      destLat: b.trip.schedule.route.destinationDistrict?.latitude,
      destLng: b.trip.schedule.route.destinationDistrict?.longitude,
    });

    return {
      bookingId: b.id,
      ticketNumber: b.ticketNumber,
      seatNumber: b.seat.seatNumber,
      trip: {
        id: b.trip.id,
        status: b.trip.status,
        tripDate: b.trip.tripDate.toISOString(),
        currentLat: b.trip.currentLat,
        currentLng: b.trip.currentLng,
        eta: (b.trip.eta ?? prediction.eta).toISOString(),
        predictedDelayMinutes: b.trip.predictedDelayMinutes ?? prediction.predictedDelayMinutes,
        delayReason: b.trip.delayReason ?? prediction.reason,
        busNumber: b.trip.bus.busNumber,
        driverName: b.trip.driver.fullName,
        departureTime: b.trip.schedule.departureTime,
        arrivalTime: b.trip.schedule.arrivalTime,
        route: {
          source: b.trip.schedule.route.source,
          destination: b.trip.schedule.route.destination,
          sourceLat: b.trip.schedule.route.sourceDistrict?.latitude ?? null,
          sourceLng: b.trip.schedule.route.sourceDistrict?.longitude ?? null,
          destLat: b.trip.schedule.route.destinationDistrict?.latitude ?? null,
          destLng: b.trip.schedule.route.destinationDistrict?.longitude ?? null,
        },
        trail: b.trip.locations.map((l) => ({
          lat: l.latitude,
          lng: l.longitude,
          at: l.recordedAt.toISOString(),
        })),
        prediction: {
          ...prediction,
          eta: prediction.eta.toISOString(),
        },
      },
    };
  });
}

export async function getDriverActiveTrips() {
  const session = await requireDriver();
  const driver = await db.driver.findFirst({
    where: { userId: session.user.id, deletedAt: null },
  });
  if (!driver) return [];

  const trips = await db.trip.findMany({
    where: {
      driverId: driver.id,
      deletedAt: null,
      status: { in: ["SCHEDULED", "BOARDING", "IN_TRANSIT", "DELAYED"] },
    },
    include: {
      schedule: { include: { route: true } },
      bus: true,
    },
    orderBy: { tripDate: "asc" },
    take: 15,
  });

  return trips.map((t) => ({
    id: t.id,
    status: t.status,
    tripDate: t.tripDate.toISOString(),
    busNumber: t.bus.busNumber,
    departureTime: t.schedule.departureTime,
    arrivalTime: t.schedule.arrivalTime,
    source: t.schedule.route.source,
    destination: t.schedule.route.destination,
    currentLat: t.currentLat,
    currentLng: t.currentLng,
    predictedDelayMinutes: t.predictedDelayMinutes,
  }));
}

export async function getTripTrackingPublic(tripId: string) {
  await requireAuth();
  const trip = await db.trip.findFirst({
    where: { id: tripId, deletedAt: null },
    include: {
      schedule: { include: { route: { include: { sourceDistrict: true, destinationDistrict: true } } } },
      bus: true,
      driver: true,
      locations: { orderBy: { recordedAt: "desc" }, take: 50 },
    },
  });
  if (!trip) return null;

  const prediction = predictDelay({
    tripDate: trip.tripDate,
    departureTime: trip.schedule.departureTime,
    arrivalTime: trip.schedule.arrivalTime,
    estimatedDurationMinutes: trip.schedule.route.estimatedDuration,
    distanceKm: trip.schedule.route.distance,
    status: trip.status,
    startedAt: trip.startedAt,
    currentLat: trip.currentLat,
    currentLng: trip.currentLng,
    sourceLat: trip.schedule.route.sourceDistrict?.latitude,
    sourceLng: trip.schedule.route.sourceDistrict?.longitude,
    destLat: trip.schedule.route.destinationDistrict?.latitude,
    destLng: trip.schedule.route.destinationDistrict?.longitude,
  });

  return {
    id: trip.id,
    status: trip.status,
    currentLat: trip.currentLat,
    currentLng: trip.currentLng,
    busNumber: trip.bus.busNumber,
    driverName: trip.driver.fullName,
    route: {
      source: trip.schedule.route.source,
      destination: trip.schedule.route.destination,
      sourceLat: trip.schedule.route.sourceDistrict?.latitude ?? 23.8103,
      sourceLng: trip.schedule.route.sourceDistrict?.longitude ?? 90.4125,
      destLat: trip.schedule.route.destinationDistrict?.latitude ?? 22.3569,
      destLng: trip.schedule.route.destinationDistrict?.longitude ?? 91.7832,
    },
    trail: trip.locations.map((l) => ({ lat: l.latitude, lng: l.longitude })),
    prediction: { ...prediction, eta: prediction.eta.toISOString() },
  };
}

export async function listSosAlertsForAdmin() {
  await requireManager();
  const alerts = await db.sosAlert.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      passenger: true,
      driver: true,
      trip: { include: { schedule: { include: { route: true } }, bus: true } },
    },
  });
  return alerts;
}
