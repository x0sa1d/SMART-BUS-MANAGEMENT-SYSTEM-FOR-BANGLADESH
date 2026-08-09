import { db } from "@/lib/db";
import {
  seedBangladeshLocations,
  seedDistrictStops,
  seedSampleSchedulesAndTrips,
} from "./seed-bangladesh";
import { seedDatasetRoutes, seedDatasetServices } from "./seed-dataset-routes";
import { seedBusCompanies, linkBusesAndDriversToCompanies } from "./seed-companies";
import { seedFleet, refreshScheduleFares } from "./seed-fleet";
import { seedUpazilas, upgradeTerminalStops } from "./seed-upazilas";
import { seedSamplePassengerBookings } from "./seed-bookings";
import { seedDemoAccounts } from "./seed-users";

async function main() {
  console.log("Seeding database...");

  const existingSettings = await db.settings.findFirst();
  if (!existingSettings) {
    await db.settings.create({
      data: {
        companyName: "Smart Bus Management",
        companyAddress: "Dhaka, Bangladesh",
        companyPhone: "+880 1234-567890",
        companyEmail: "info@smartbus.com",
      },
    });
  }

  const driver1 = await db.driver.upsert({
    where: { licenseNumber: "DL-123456" },
    update: {},
    create: {
      fullName: "Karim Ahmed",
      licenseNumber: "DL-123456",
      phone: "+880 1711-111111",
      email: "karim@smartbus.com",
      experience: 8,
    },
  });

  const driver2 = await db.driver.upsert({
    where: { licenseNumber: "DL-789012" },
    update: {},
    create: {
      fullName: "Rahim Khan",
      licenseNumber: "DL-789012",
      phone: "+880 1711-222222",
      email: "rahim@smartbus.com",
      experience: 5,
    },
  });

  const bus1 = await db.bus.upsert({
    where: { busNumber: "SBM-001" },
    update: {},
    create: {
      busNumber: "SBM-001",
      registrationNumber: "DHK-GA-11-1234",
      busType: "AC",
      capacity: 40,
      isAC: true,
      driverId: driver1.id,
      status: "AVAILABLE",
    },
  });

  const bus2 = await db.bus.upsert({
    where: { busNumber: "SBM-002" },
    update: {},
    create: {
      busNumber: "SBM-002",
      registrationNumber: "DHK-KA-22-5678",
      busType: "DELUXE",
      capacity: 36,
      isAC: true,
      driverId: driver2.id,
      status: "AVAILABLE",
    },
  });

  for (const bus of [bus1, bus2]) {
    const existingSeats = await db.seat.count({ where: { busId: bus.id } });
    if (existingSeats === 0) {
      const seats = [];
      for (let i = 0; i < bus.capacity; i++) {
        const row = Math.floor(i / 4) + 1;
        const col = (i % 4) + 1;
        seats.push({
          busId: bus.id,
          seatNumber: `${row}${String.fromCharCode(64 + col)}`,
          row,
          column: col,
          seatType: col <= 2 ? "REGULAR" as const : col === 3 ? "PREMIUM" as const : "VIP" as const,
        });
      }
      await db.seat.createMany({ data: seats });
    }
  }

  // Ensure all buses have seat layouts for booking
  const allBuses = await db.bus.findMany({ where: { deletedAt: null } });
  for (const bus of allBuses) {
    const existingSeats = await db.seat.count({ where: { busId: bus.id } });
    if (existingSeats === 0) {
      const capacity = bus.capacity || 40;
      const seats = [];
      for (let i = 0; i < capacity; i++) {
        const row = Math.floor(i / 4) + 1;
        const col = (i % 4) + 1;
        seats.push({
          busId: bus.id,
          seatNumber: `${row}${String.fromCharCode(64 + col)}`,
          row,
          column: col,
          seatType: "REGULAR" as const,
        });
      }
      await db.seat.createMany({ data: seats });
    }
  }

  await seedDemoAccounts(driver1.id);

  // Bangladesh: 8 divisions, 64 districts, dataset from curated dataset v1
  await seedBangladeshLocations();
  await seedUpazilas();
  await seedDatasetRoutes();
  await seedDistrictStops();
  await upgradeTerminalStops();
  await seedBusCompanies();
  if (process.env.SEED_FLEET === "1") {
    await seedFleet();
    await refreshScheduleFares();
  } else {
    await seedSampleSchedulesAndTrips();
    await seedDatasetServices();
    await refreshScheduleFares();
  }
  await linkBusesAndDriversToCompanies();
  await seedSamplePassengerBookings();

  await db.maintenance.createMany({
    data: [
      {
        busId: bus1.id,
        title: "Engine Oil Change",
        description: "Regular engine oil and filter change",
        cost: 3500,
        status: "SCHEDULED",
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    ],
    skipDuplicates: true,
  });

  // Permissions & RBAC
  const permissionData = [
    { name: "manage_users", module: "users", description: "Manage all users" },
    { name: "manage_buses", module: "buses", description: "Manage fleet" },
    { name: "manage_routes", module: "routes", description: "Manage routes" },
    { name: "manage_schedules", module: "schedules", description: "Manage schedules" },
    { name: "manage_bookings", module: "bookings", description: "Manage bookings" },
    { name: "manage_payments", module: "payments", description: "Manage payments" },
    { name: "view_reports", module: "reports", description: "View reports" },
    { name: "view_analytics", module: "analytics", description: "View analytics" },
    { name: "book_tickets", module: "bookings", description: "Book tickets" },
    { name: "view_trips", module: "trips", description: "View assigned trips" },
  ];

  for (const perm of permissionData) {
    await db.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
  }

  const allPermissions = await db.permission.findMany();
  const adminPermissions = allPermissions.filter((p) => p.name !== "book_tickets" && p.name !== "view_trips");
  for (const perm of adminPermissions) {
    for (const role of ["SUPER_ADMIN", "MANAGER"] as const) {
      await db.rolePermission.upsert({
        where: { role_permissionId: { role, permissionId: perm.id } },
        update: {},
        create: { role, permissionId: perm.id },
      });
    }
  }

  const passengerBook = allPermissions.find((p) => p.name === "book_tickets");
  const driverTrips = allPermissions.find((p) => p.name === "view_trips");
  if (passengerBook) {
    await db.rolePermission.upsert({
      where: { role_permissionId: { role: "PASSENGER", permissionId: passengerBook.id } },
      update: {},
      create: { role: "PASSENGER", permissionId: passengerBook.id },
    });
  }
  if (driverTrips) {
    await db.rolePermission.upsert({
      where: { role_permissionId: { role: "DRIVER", permissionId: driverTrips.id } },
      update: {},
      create: { role: "DRIVER", permissionId: driverTrips.id },
    });
  }

  // Fare rules for Dhaka-Chattogram route
  const dhakaCtgRoute = await db.route.findFirst({
    where: { source: "Dhaka", destination: "Chattogram", deletedAt: null },
  });
  if (dhakaCtgRoute) {
    await db.fareRule.createMany({
      data: [
        { routeId: dhakaCtgRoute.id, name: "Base Fare", ruleType: "BASE", multiplier: 1, isActive: true },
        { routeId: dhakaCtgRoute.id, name: "VIP Seat Surcharge", ruleType: "SEAT_TYPE", seatType: "VIP", multiplier: 1.5, isActive: true },
        { routeId: dhakaCtgRoute.id, name: "Premium Seat Surcharge", ruleType: "SEAT_TYPE", seatType: "PREMIUM", multiplier: 1.25, isActive: true },
        { routeId: dhakaCtgRoute.id, name: "Peak Hour (6-9 AM)", ruleType: "PEAK_HOUR", startTime: "06:00", endTime: "09:00", multiplier: 1.1, isActive: true },
      ],
      skipDuplicates: true,
    });
  }

  // Bus & driver documents
  const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  await db.busDocument.createMany({
    data: [
      { busId: bus1.id, type: "INSURANCE", documentNo: "INS-2024-001", expiresAt: oneYearLater },
      { busId: bus1.id, type: "REGISTRATION", documentNo: bus1.registrationNumber, expiresAt: oneYearLater },
      { busId: bus2.id, type: "INSURANCE", documentNo: "INS-2024-002", expiresAt: oneYearLater },
      { busId: bus2.id, type: "FITNESS", documentNo: "FIT-2024-002", expiresAt: oneYearLater },
    ],
    skipDuplicates: true,
  });

  await db.driverDocument.createMany({
    data: [
      { driverId: driver1.id, type: "LICENSE", documentNo: driver1.licenseNumber, expiresAt: oneYearLater },
      { driverId: driver2.id, type: "LICENSE", documentNo: driver2.licenseNumber, expiresAt: oneYearLater },
    ],
    skipDuplicates: true,
  });

  // Driver performance
  const now = new Date();
  await db.driverPerformance.createMany({
    data: [
      { driverId: driver1.id, month: now.getMonth() + 1, year: now.getFullYear(), tripsCompleted: 45, onTimeRate: 92, rating: 4.5, distanceCovered: 11250 },
      { driverId: driver2.id, month: now.getMonth() + 1, year: now.getFullYear(), tripsCompleted: 38, onTimeRate: 88, rating: 4.2, distanceCovered: 9120 },
    ],
    skipDuplicates: true,
  });

  // Sample report
  const existingReport = await db.report.findFirst({ where: { title: "Monthly Revenue Report" } });
  if (!existingReport) {
    await db.report.create({
      data: {
        title: "Monthly Revenue Report",
        type: "MONTHLY_REVENUE",
        format: "PDF",
        summary: "Auto-generated monthly revenue summary",
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: now,
      },
    });
  }

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
