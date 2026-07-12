"use server";

import { revalidateSystem } from "@/lib/revalidate-system";
import { db, excludeDeleted } from "@/lib/db";
import { requireAuth } from "@/lib/auth-server";
import { success, failure, getErrorMessage } from "@/lib/action-utils";
import { bookingSchema, multiBookingSchema } from "@/schemas";
import {
  ACTIVE_BOOKING_STATUSES,
  resolveTripFare,
} from "@/lib/passenger-transport";
import { createPaidBooking } from "@/lib/ticket-service";
import type { PaymentMethod } from "@prisma/client";

async function getOrCreatePassenger(
  userId: string,
  name: string,
  email: string,
  phone?: string
) {
  let passenger = await db.passenger.findFirst({
    where: { userId, deletedAt: null },
  });
  if (!passenger) {
    passenger = await db.passenger.create({
      data: { userId, fullName: name, email, phone: phone || "" },
    });
  } else if (phone && !passenger.phone) {
    await db.passenger.update({ where: { id: passenger.id }, data: { phone } });
  }
  return passenger;
}

async function validateSeatsForTrip(tripId: string, seatIds: string[]) {
  const uniqueSeatIds = [...new Set(seatIds)];
  if (uniqueSeatIds.length !== seatIds.length) {
    return failure("Duplicate seats selected");
  }

  const trip = await db.trip.findFirst({
    where: { id: tripId, deletedAt: null, status: { in: ["SCHEDULED", "BOARDING"] } },
    include: { schedule: { include: { route: true } } },
  });
  if (!trip) return failure("Trip not found or no longer available");

  const fare = resolveTripFare(trip.schedule);

  for (const seatId of uniqueSeatIds) {
    const seat = await db.seat.findFirst({
      where: { id: seatId, busId: trip.busId, deletedAt: null },
    });
    if (!seat) return failure("Invalid seat selected");

    const seatTaken = await db.booking.findFirst({
      where: {
        tripId,
        seatId,
        deletedAt: null,
        status: { in: [...ACTIVE_BOOKING_STATUSES] },
      },
    });
    if (seatTaken) return failure(`Seat ${seat.seatNumber} is no longer available`);
  }

  return success({ trip, fare, seatIds: uniqueSeatIds });
}

export async function getSchedules() {
  const { getSchedulesForAccess } = await import("@/actions/schedule.actions");
  return getSchedulesForAccess();
}

export async function createSchedule(formData: FormData) {
  const { createScheduleManaged } = await import("@/actions/schedule.actions");
  return createScheduleManaged(formData);
}

export async function getBookings() {
  return db.booking.findMany({
    where: excludeDeleted(),
    include: {
      passenger: true,
      seat: true,
      trip: { include: { schedule: { include: { route: true } } } },
      payment: true,
      ticket: true,
    },
    orderBy: { bookedAt: "desc" },
  });
}

export async function getMyBookings() {
  const session = await requireAuth();
  const passenger = await db.passenger.findFirst({
    where: { userId: session.user.id, deletedAt: null },
  });
  if (!passenger) return [];

  return db.booking.findMany({
    where: { passengerId: passenger.id, deletedAt: null },
    include: {
      seat: true,
      trip: {
        include: {
          schedule: {
            include: {
              route: true,
              bus: { include: { company: { select: { name: true } } } },
            },
          },
        },
      },
      payment: true,
      ticket: true,
    },
    orderBy: { bookedAt: "desc" },
  });
}

export async function createMultiSeatBooking(formData: FormData) {
  try {
    const session = await requireAuth();
    const seatIds = formData.getAll("seatIds") as string[];
    const parsed = multiBookingSchema.safeParse({
      tripId: formData.get("tripId"),
      seatIds,
      paymentMethod: formData.get("paymentMethod"),
      phone: formData.get("phone") || undefined,
    });
    if (!parsed.success) return failure(parsed.error.errors[0].message);

    const validation = await validateSeatsForTrip(parsed.data.tripId, parsed.data.seatIds);
    if (!validation.success || !validation.data) return failure(validation.error ?? "Validation failed");

    const { trip, fare, seatIds: validSeatIds } = validation.data;
    const passenger = await getOrCreatePassenger(
      session.user.id,
      session.user.name,
      session.user.email,
      parsed.data.phone
    );

    const ticketNumbers: string[] = [];
    let totalAmount = 0;

    await db.$transaction(async (tx) => {
      for (let i = 0; i < validSeatIds.length; i++) {
        const { ticket } = await createPaidBooking(tx, {
          passengerId: passenger.id,
          tripId: trip.id,
          seatId: validSeatIds[i],
          fare,
          paymentMethod: parsed.data.paymentMethod as PaymentMethod,
          transactionSuffix: `-${i}`,
        });
        ticketNumbers.push(ticket.ticketNumber);
        totalAmount += fare;
      }
    });

    revalidateSystem(["/passenger/bookings"]);
    return success({ ticketNumbers, totalAmount, count: ticketNumbers.length });
  } catch (error) {
    return failure(getErrorMessage(error));
  }
}

export async function createBooking(formData: FormData) {
  const parsed = bookingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.errors[0].message);

  const multiFd = new FormData();
  multiFd.set("tripId", parsed.data.tripId);
  multiFd.append("seatIds", parsed.data.seatId);
  multiFd.set("paymentMethod", parsed.data.paymentMethod);
  if (parsed.data.phone) multiFd.set("phone", parsed.data.phone);
  return createMultiSeatBooking(multiFd);
}

export async function checkoutCart(formData: FormData) {
  try {
    const session = await requireAuth();
    const itemsRaw = formData.get("items");
    const paymentMethod = formData.get("paymentMethod") as string;
    const phone = (formData.get("phone") as string) || "";

    if (!itemsRaw || !paymentMethod) return failure("Invalid checkout data");

    const items = JSON.parse(String(itemsRaw)) as { tripId: string; seatId: string }[];
    if (!Array.isArray(items) || items.length === 0) return failure("Cart is empty");

    const passenger = await getOrCreatePassenger(
      session.user.id,
      session.user.name,
      session.user.email,
      phone
    );

    const ticketNumbers: string[] = [];
    let totalAmount = 0;

    await db.$transaction(async (tx) => {
      for (const item of items) {
        const trip = await tx.trip.findFirst({
          where: { id: item.tripId, deletedAt: null, status: { in: ["SCHEDULED", "BOARDING"] } },
          include: { schedule: { include: { route: true } } },
        });
        if (!trip) throw new Error("A trip in your cart is no longer available");

        const seat = await tx.seat.findFirst({
          where: { id: item.seatId, busId: trip.busId, deletedAt: null },
        });
        if (!seat) throw new Error("Invalid seat in cart");

        const seatTaken = await tx.booking.findFirst({
          where: {
            tripId: item.tripId,
            seatId: item.seatId,
            deletedAt: null,
            status: { in: [...ACTIVE_BOOKING_STATUSES] },
          },
        });
        if (seatTaken) throw new Error(`Seat ${seat.seatNumber} is no longer available`);

        const fare = resolveTripFare(trip.schedule);
        totalAmount += fare;

        const { ticket } = await createPaidBooking(tx, {
          passengerId: passenger.id,
          tripId: item.tripId,
          seatId: item.seatId,
          fare,
          paymentMethod: paymentMethod as PaymentMethod,
          transactionSuffix: `-${ticketNumbers.length}`,
        });
        ticketNumbers.push(ticket.ticketNumber);
      }
    });

    revalidateSystem(["/passenger/bookings"]);
    return success({ ticketNumbers, totalAmount, count: ticketNumbers.length });
  } catch (error) {
    return failure(getErrorMessage(error));
  }
}
