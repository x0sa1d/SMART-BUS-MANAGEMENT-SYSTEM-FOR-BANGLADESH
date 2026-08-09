import QRCode from "qrcode";
import type { PaymentMethod } from "@prisma/client";
import { db } from "@/lib/db";
import { generateTicketNumber } from "@/lib/utils";

export type TicketQrPayload = {
  v: "1";
  verificationId: string;
  ticketNumber: string;
  bookingId: string;
  tripId: string;
  seatId: string;
  issuedAt: string;
};

export function generateVerificationId(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `VRF-${stamp}-${rand}`;
}

/** Classic ticket serial shown under QR (e.g. 123 45678 90123). */
export function formatTicketSerial(ticketNumber: string, verificationId: string): string {
  const digits = `${ticketNumber}${verificationId}`.replace(/\D/g, "");
  const seed = (digits || "0").padStart(13, "0").slice(-13);
  return `${seed.slice(0, 3)} ${seed.slice(3, 8)} ${seed.slice(8)}`;
}

export function buildTicketQrPayload(input: {
  verificationId: string;
  ticketNumber: string;
  bookingId: string;
  tripId: string;
  seatId: string;
}): TicketQrPayload {
  return {
    v: "1",
    verificationId: input.verificationId,
    ticketNumber: input.ticketNumber,
    bookingId: input.bookingId,
    tripId: input.tripId,
    seatId: input.seatId,
    issuedAt: new Date().toISOString(),
  };
}

export async function generateQrDataUrl(payload: TicketQrPayload): Promise<string> {
  return QRCode.toDataURL(JSON.stringify(payload), {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 280,
  });
}

export function parseTicketQrInput(raw: string): { verificationId: string; ticketNumber?: string } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed) as TicketQrPayload;
    if (parsed?.verificationId) {
      return { verificationId: parsed.verificationId, ticketNumber: parsed.ticketNumber };
    }
  } catch {
    // plain ID / serial
  }
  const compact = trimmed.replace(/\s+/g, "");
  if (compact.startsWith("VRF-") || trimmed.startsWith("VRF-")) {
    return { verificationId: trimmed.startsWith("VRF-") ? trimmed : compact };
  }
  if (compact.startsWith("SBM-") || trimmed.startsWith("SBM-")) {
    return { verificationId: "", ticketNumber: trimmed.startsWith("SBM-") ? trimmed : compact };
  }
  // Serial digits only — match via ticket number suffix search handled in action
  if (/^\d{10,16}$/.test(compact)) {
    return { verificationId: "", ticketNumber: compact };
  }
  return { verificationId: trimmed };
}

type BookingTx = Parameters<Parameters<typeof db.$transaction>[0]>[0];

export async function issueTicketForBooking(
  tx: BookingTx,
  input: {
    bookingId: string;
    ticketNumber: string;
    tripId: string;
    seatId: string;
  }
) {
  const verificationId = generateVerificationId();
  const qrPayload = buildTicketQrPayload({
    verificationId,
    ticketNumber: input.ticketNumber,
    bookingId: input.bookingId,
    tripId: input.tripId,
    seatId: input.seatId,
  });

  return tx.ticket.create({
    data: {
      bookingId: input.bookingId,
      ticketNumber: input.ticketNumber,
      verificationId,
      qrCodeData: JSON.stringify(qrPayload),
      status: "ISSUED",
    },
  });
}

export async function createPaidBooking(
  tx: BookingTx,
  input: {
    passengerId: string;
    tripId: string;
    seatId: string;
    fare: number;
    paymentMethod: PaymentMethod;
    transactionSuffix?: string;
  }
) {
  const ticketNumber = generateTicketNumber();

  const booking = await tx.booking.create({
    data: {
      ticketNumber,
      passengerId: input.passengerId,
      tripId: input.tripId,
      seatId: input.seatId,
      fare: input.fare,
      status: "CONFIRMED",
    },
  });

  await tx.payment.create({
    data: {
      bookingId: booking.id,
      amount: input.fare,
      method: input.paymentMethod,
      status: "COMPLETED",
      paidAt: new Date(),
      transactionId: `TXN-${Date.now()}${input.transactionSuffix ?? ""}`,
    },
  });

  const ticket = await issueTicketForBooking(tx, {
    bookingId: booking.id,
    ticketNumber,
    tripId: input.tripId,
    seatId: input.seatId,
  });

  return { booking, ticket };
}
