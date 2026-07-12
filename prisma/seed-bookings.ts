import { db, excludeDeleted } from "@/lib/db";
import { hashPassword } from "better-auth/crypto";
import type { PaymentMethod } from "@prisma/client";

const DEMO_PASSWORD = "Passenger@12345";

const SAMPLE_PASSENGERS = [
  { name: "Fatima Rahman", email: "fatima.passenger@smartbus.com", phone: "01711000001" },
  { name: "Mohammad Ali", email: "ali.passenger@smartbus.com", phone: "01711000002" },
  { name: "Ayesha Khatun", email: "ayesha.passenger@smartbus.com", phone: "01711000003" },
  { name: "Hasan Mahmud", email: "hasan.passenger@smartbus.com", phone: "01711000004" },
  { name: "Nusrat Jahan", email: "nusrat.passenger@smartbus.com", phone: "01711000005" },
  { name: "Kamal Hossain", email: "kamal.passenger@smartbus.com", phone: "01711000006" },
  { name: "Sabina Yasmin", email: "sabina.passenger@smartbus.com", phone: "01711000007" },
  { name: "Imran Chowdhury", email: "imran.passenger@smartbus.com", phone: "01711000008" },
  { name: "Tasnim Akter", email: "tasnim.passenger@smartbus.com", phone: "01711000009" },
  { name: "Rashedul Islam", email: "rashed.passenger@smartbus.com", phone: "01711000010" },
  { name: "Papia Sultana", email: "papia.passenger@smartbus.com", phone: "01711000011" },
  { name: "Shakib Ahmed", email: "shakib.passenger@smartbus.com", phone: "01711000012" },
  { name: "Mitu Begum", email: "mitu.passenger@smartbus.com", phone: "01711000013" },
  { name: "Tanvir Hassan", email: "tanvir.passenger@smartbus.com", phone: "01711000014" },
] as const;

const PAYMENT_METHODS: PaymentMethod[] = ["BKASH", "NAGAD", "ROCKET", "CASH", "CARD", "SSLCOMMERZ"];

function ticketNumberFor(index: number) {
  return `SBM-SEED-${String(index + 1).padStart(4, "0")}`;
}

async function ensurePassengerUser(sample: (typeof SAMPLE_PASSENGERS)[number]) {
  const hashedPassword = await hashPassword(DEMO_PASSWORD);

  let user = await db.user.findUnique({ where: { email: sample.email } });
  if (!user) {
    const userId = crypto.randomUUID();
    user = await db.user.create({
      data: {
        id: userId,
        name: sample.name,
        email: sample.email,
        emailVerified: true,
        role: "PASSENGER",
        accounts: {
          create: {
            id: crypto.randomUUID(),
            accountId: userId,
            providerId: "credential",
            password: hashedPassword,
          },
        },
      },
    });
  }

  let passenger = await db.passenger.findFirst({
    where: { userId: user.id, deletedAt: null },
  });

  if (!passenger) {
    passenger = await db.passenger.create({
      data: {
        userId: user.id,
        fullName: sample.name,
        email: sample.email,
        phone: sample.phone,
        address: "Bangladesh",
      },
    });
  }

  return passenger;
}

export async function seedSamplePassengerBookings() {
  console.log("Seeding 14 passengers with tickets on different routes...");

  const trips = await db.trip.findMany({
    where: {
      ...excludeDeleted(),
      status: { in: ["SCHEDULED", "BOARDING"] },
      schedule: { deletedAt: null, isActive: true },
    },
    include: {
      schedule: { include: { route: true } },
      bus: {
        include: {
          seats: {
            where: excludeDeleted(),
            orderBy: [{ row: "asc" }, { column: "asc" }],
          },
        },
      },
      bookings: {
        where: {
          deletedAt: null,
          status: { in: ["CONFIRMED", "PENDING"] },
        },
        select: { seatId: true },
      },
    },
    orderBy: [{ tripDate: "asc" }, { schedule: { departureTime: "asc" } }],
    take: 80,
  });

  const tripsByRoute = new Map<string, (typeof trips)[number]>();
  for (const trip of trips) {
    const route = trip.schedule.route;
    const key = `${route.source}|${route.destination}`;
    if (!tripsByRoute.has(key)) tripsByRoute.set(key, trip);
  }

  const routeTrips = Array.from(tripsByRoute.values());
  if (routeTrips.length === 0) {
    console.log("No trips available — skip passenger booking seed");
    return;
  }

  let created = 0;
  const usedSeatsPerTrip = new Map<string, Set<string>>();

  for (const trip of routeTrips) {
    usedSeatsPerTrip.set(
      trip.id,
      new Set(trip.bookings.map((b) => b.seatId))
    );
  }

  for (let i = 0; i < SAMPLE_PASSENGERS.length; i++) {
    const sample = SAMPLE_PASSENGERS[i];
    const ticketNumber = ticketNumberFor(i);

    const existingBooking = await db.booking.findUnique({ where: { ticketNumber } });
    if (existingBooking) continue;

    const trip = routeTrips[i % routeTrips.length];
    const usedSeats = usedSeatsPerTrip.get(trip.id) ?? new Set<string>();

    const seat = trip.bus.seats.find((s) => !usedSeats.has(s.id));
    if (!seat) {
      console.warn(`No free seat on ${trip.schedule.route.source} → ${trip.schedule.route.destination} for ${sample.name}`);
      continue;
    }

    const passenger = await ensurePassengerUser(sample);
    const fare = trip.schedule.fare;
    const paymentMethod = PAYMENT_METHODS[i % PAYMENT_METHODS.length];
    const bookedAt = new Date(Date.now() - (SAMPLE_PASSENGERS.length - i) * 6 * 60 * 60 * 1000);

    await db.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          ticketNumber,
          passengerId: passenger.id,
          tripId: trip.id,
          seatId: seat.id,
          fare,
          status: "CONFIRMED",
          bookedAt,
        },
      });

      await tx.payment.create({
        data: {
          bookingId: booking.id,
          amount: fare,
          method: paymentMethod,
          status: "COMPLETED",
          transactionId: `TXN-SEED-${String(i + 1).padStart(5, "0")}`,
          paidAt: bookedAt,
        },
      });

      await tx.ticket.create({
        data: {
          bookingId: booking.id,
          ticketNumber,
          verificationId: `VRF-SEED-${String(i + 1).padStart(6, "0")}`,
          status: "ISSUED",
          qrCodeData: JSON.stringify({
            v: "1",
            verificationId: `VRF-SEED-${String(i + 1).padStart(6, "0")}`,
            ticketNumber,
            bookingId: booking.id,
            tripId: trip.id,
            seatId: seat.id,
            issuedAt: bookedAt.toISOString(),
          }),
        },
      });
    });

    usedSeats.add(seat.id);
    usedSeatsPerTrip.set(trip.id, usedSeats);
    created++;
  }

  console.log(
    `Seeded ${created} passenger bookings across ${Math.min(SAMPLE_PASSENGERS.length, routeTrips.length)} different routes`
  );
  console.log(`Demo login: e.g. fatima.passenger@smartbus.com / ${DEMO_PASSWORD}`);
}
