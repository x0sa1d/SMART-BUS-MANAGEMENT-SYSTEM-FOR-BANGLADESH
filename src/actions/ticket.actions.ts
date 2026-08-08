"use server";

import { revalidateSystem } from "@/lib/revalidate-system";
import { db, excludeDeleted } from "@/lib/db";
import { requireAuth, requirePlatformWrite } from "@/lib/auth-server";
import { success, failure, getErrorMessage } from "@/lib/action-utils";
import {
  generateQrDataUrl,
  parseTicketQrInput,
  generateVerificationId,
  buildTicketQrPayload,
  type TicketQrPayload,
} from "@/lib/ticket-service";
import { formatDate } from "@/lib/utils";

const ticketInclude = {
  booking: {
    include: {
      passenger: true,
      seat: true,
      payment: true,
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
    },
  },
} as const;

export async function getETicketData(ticketNumber: string) {
  try {
    const session = await requireAuth();
    const ticket = await db.ticket.findFirst({
      where: { ticketNumber, deletedAt: null },
      include: ticketInclude,
    });
    if (!ticket) return failure("Ticket not found");

    let verificationId = ticket.verificationId;
    if (!verificationId) {
      verificationId = generateVerificationId();
      const payload = buildTicketQrPayload({
        verificationId,
        ticketNumber: ticket.ticketNumber,
        bookingId: ticket.bookingId,
        tripId: ticket.booking.tripId,
        seatId: ticket.booking.seatId,
      });
      await db.ticket.update({
        where: { id: ticket.id },
        data: { verificationId, qrCodeData: JSON.stringify(payload) },
      });
    }

    const passengerUserId = ticket.booking.passenger.userId;
    if (passengerUserId !== session.user.id) {
      return failure("You do not have access to this ticket");
    }

    const payload = JSON.parse(ticket.qrCodeData) as TicketQrPayload;
    const qrDataUrl = await generateQrDataUrl(payload);
    const b = ticket.booking;
    const trip = b.trip;
    const schedule = trip.schedule;

    return success({
      ticketNumber: ticket.ticketNumber,
      verificationId: ticket.verificationId,
      status: ticket.status,
      bookingId: b.id,
      passengerName: b.passenger.fullName,
      companyName: schedule.bus.company?.name ?? "Bus Operator",
      route: `${schedule.route.source} → ${schedule.route.destination}`,
      routeName: schedule.route.name,
      tripDate: formatDate(trip.tripDate),
      departureTime: schedule.departureTime,
      arrivalTime: schedule.arrivalTime,
      seatNumber: b.seat.seatNumber,
      fare: Number(b.fare),
      paymentMethod: b.payment?.method ?? null,
      qrDataUrl,
    });
  } catch (error) {
    return failure(getErrorMessage(error));
  }
}

export async function lookupTicketForVerification(input: string) {
  try {
    await requirePlatformWrite();
    const parsed = parseTicketQrInput(input);
    if (!parsed) return failure("Invalid QR code or verification ID");

    const ticket = await db.ticket.findFirst({
      where: {
        deletedAt: null,
        OR: [
          ...(parsed.verificationId ? [{ verificationId: parsed.verificationId }] : []),
          ...(parsed.ticketNumber ? [{ ticketNumber: parsed.ticketNumber }] : []),
        ],
      },
      include: ticketInclude,
    });
    if (!ticket) return failure("Ticket not found");

    const b = ticket.booking;
    const schedule = b.trip.schedule;

    return success({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      verificationId: ticket.verificationId,
      status: ticket.status,
      bookingId: b.id,
      passengerName: b.passenger.fullName,
      companyName: schedule.bus.company?.name ?? "Bus Operator",
      route: `${schedule.route.source} → ${schedule.route.destination}`,
      tripDate: formatDate(b.trip.tripDate),
      departureTime: schedule.departureTime,
      seatNumber: b.seat.seatNumber,
      busNumber: schedule.bus.busNumber,
      verifiedAt: ticket.verifiedAt?.toISOString() ?? null,
    });
  } catch (error) {
    return failure(getErrorMessage(error));
  }
}

export async function verifyTicket(input: string) {
  try {
    await requirePlatformWrite();
    const session = await requireAuth();
    const parsed = parseTicketQrInput(input);
    if (!parsed) return failure("Invalid QR code or verification ID");

    const ticket = await db.ticket.findFirst({
      where: {
        deletedAt: null,
        OR: [
          ...(parsed.verificationId ? [{ verificationId: parsed.verificationId }] : []),
          ...(parsed.ticketNumber ? [{ ticketNumber: parsed.ticketNumber }] : []),
        ],
      },
      include: { booking: true },
    });
    if (!ticket) return failure("Ticket not found");

    if (ticket.status === "VERIFIED") {
      return failure("Ticket already verified. Duplicate use prevented");
    }
    if (ticket.status === "CANCELLED") {
      return failure("Ticket has been cancelled");
    }
    if (ticket.booking.status === "CANCELLED") {
      return failure("Booking was cancelled");
    }

    const now = new Date();
    await db.$transaction([
      db.ticket.update({
        where: { id: ticket.id },
        data: {
          status: "VERIFIED",
          verifiedAt: now,
          verifiedById: session.user.id,
        },
      }),
      db.booking.update({
        where: { id: ticket.bookingId },
        data: { status: "COMPLETED" },
      }),
    ]);

    revalidateSystem(["/dashboard/ticket-verification", "/passenger/bookings"]);
    return success({
      ticketNumber: ticket.ticketNumber,
      verificationId: ticket.verificationId,
      verifiedAt: now.toISOString(),
    });
  } catch (error) {
    return failure(getErrorMessage(error));
  }
}

export async function getVerifiedTickets(limit = 20) {
  await requirePlatformWrite();
  return db.ticket.findMany({
    where: { status: "VERIFIED", deletedAt: null },
    include: ticketInclude,
    orderBy: { verifiedAt: "desc" },
    take: limit,
  });
}
