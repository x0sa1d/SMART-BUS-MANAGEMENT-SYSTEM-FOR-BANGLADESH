import { db } from "../src/lib/db";
import {
  buildTicketQrPayload,
  generateVerificationId,
} from "../src/lib/ticket-service";

async function main() {
  const tickets = await db.ticket.findMany({
    where: { verificationId: null, deletedAt: null },
    include: { booking: true },
  });

  for (const ticket of tickets) {
    const verificationId = generateVerificationId();
    const payload = buildTicketQrPayload({
      verificationId,
      ticketNumber: ticket.ticketNumber,
      bookingId: ticket.bookingId,
      tripId: ticket.booking.tripId,
      seatId: ticket.booking.seatId,
    });
    await db.ticket.update({
      where: { id: ticket.id },
      data: {
        verificationId,
        qrCodeData: JSON.stringify(payload),
        status: ticket.status ?? "ISSUED",
      },
    });
    console.log(`Updated ${ticket.ticketNumber} -> ${verificationId}`);
  }

  console.log(`Backfilled ${tickets.length} ticket(s)`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
