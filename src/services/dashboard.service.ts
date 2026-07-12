import { unstable_cache } from "next/cache";
import { db, excludeDeleted } from "@/lib/db";
import type { DashboardStats, ChartDataPoint, RoutePerformance } from "@/types";

function todayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end, now };
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  const { start: todayStart, end: todayEnd, now } = todayRange();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalCompanies,
    activeCompanies,
    totalBuses,
    activeBuses,
    totalRoutes,
    activeRoutes,
    tripsToday,
    activeTrips,
    totalDrivers,
    totalPassengers,
    totalBookings,
    todayBookings,
    dailyRevenueAgg,
    monthlyRevenueAgg,
    totalRevenueAgg,
    activeSchedules,
    pendingMaintenance,
    totalSeats,
    bookedSeats,
    passengersThisMonth,
    passengersLastMonth,
    totalTerminals,
    totalUpazilas,
  ] = await Promise.all([
    db.busCompany.count({ where: excludeDeleted() }),
    db.busCompany.count({ where: { ...excludeDeleted(), status: "ACTIVE" } }),
    db.bus.count({ where: excludeDeleted() }),
    db.bus.count({ where: { ...excludeDeleted(), status: { in: ["AVAILABLE", "RUNNING", "ACTIVE"] } } }),
    db.route.count({ where: excludeDeleted() }),
    db.route.count({ where: { ...excludeDeleted(), isActive: true } }),
    db.trip.count({
      where: { ...excludeDeleted(), tripDate: { gte: todayStart, lt: todayEnd } },
    }),
    db.trip.count({
      where: { ...excludeDeleted(), status: { in: ["SCHEDULED", "BOARDING", "IN_TRANSIT"] } },
    }),
    db.driver.count({ where: { ...excludeDeleted(), isActive: true } }),
    db.passenger.count({ where: excludeDeleted() }),
    db.booking.count({ where: excludeDeleted() }),
    db.booking.count({ where: { ...excludeDeleted(), bookedAt: { gte: todayStart } } }),
    db.payment.aggregate({
      where: { ...excludeDeleted(), status: "COMPLETED", paidAt: { gte: todayStart, lt: todayEnd } },
      _sum: { amount: true },
    }),
    db.payment.aggregate({
      where: { ...excludeDeleted(), status: "COMPLETED", paidAt: { gte: monthStart } },
      _sum: { amount: true },
    }),
    db.payment.aggregate({
      where: { ...excludeDeleted(), status: "COMPLETED" },
      _sum: { amount: true },
    }),
    db.schedule.count({ where: { ...excludeDeleted(), isActive: true } }),
    db.maintenance.count({
      where: { ...excludeDeleted(), status: { in: ["SCHEDULED", "IN_PROGRESS", "OVERDUE"] } },
    }),
    db.seat.count({ where: excludeDeleted() }),
    db.seat.count({ where: { ...excludeDeleted(), status: "BOOKED" } }),
    db.passenger.count({ where: { ...excludeDeleted(), createdAt: { gte: monthStart } } }),
    db.passenger.count({
      where: { ...excludeDeleted(), createdAt: { gte: lastMonthStart, lt: lastMonthEnd } },
    }),
    db.stop.count({ where: { ...excludeDeleted(), isTerminal: true } }),
    db.upazila.count(),
  ]);

  const occupancyRate = totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0;
  const passengerGrowth =
    passengersLastMonth > 0
      ? Math.round(((passengersThisMonth - passengersLastMonth) / passengersLastMonth) * 100)
      : passengersThisMonth > 0
        ? 100
        : 0;

  return {
    totalCompanies,
    activeCompanies,
    totalBuses,
    activeBuses,
    totalRoutes,
    activeRoutes,
    tripsToday,
    activeTrips,
    totalDrivers,
    totalPassengers,
    totalBookings,
    todayBookings,
    dailyRevenue: Number(dailyRevenueAgg._sum.amount || 0),
    monthlyRevenue: Number(monthlyRevenueAgg._sum.amount || 0),
    totalRevenue: Number(totalRevenueAgg._sum.amount || 0),
    activeSchedules,
    pendingMaintenance,
    occupancyRate,
    passengerGrowth,
    totalTerminals,
    totalUpazilas,
  };
}

export const getDashboardStats = unstable_cache(fetchDashboardStats, ["dashboard-stats"], {
  revalidate: 60,
  tags: ["dashboard"],
});

export async function getRevenueTrend(months = 6): Promise<ChartDataPoint[]> {
  const now = new Date();
  const ranges = Array.from({ length: months }, (_, i) => {
    const offset = months - 1 - i;
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() - offset + 1, 1);
    return { name: date.toLocaleString("en-US", { month: "short" }), date, nextMonth };
  });

  const results = await Promise.all(
    ranges.map(({ date, nextMonth }) =>
      db.payment.aggregate({
        where: { deletedAt: null, status: "COMPLETED", paidAt: { gte: date, lt: nextMonth } },
        _sum: { amount: true },
      })
    )
  );

  return ranges.map(({ name }, i) => ({ name, value: Number(results[i]._sum.amount || 0) }));
}

export async function getBookingTrend(days = 7): Promise<ChartDataPoint[]> {
  const now = new Date();
  const ranges = Array.from({ length: days }, (_, i) => {
    const offset = days - 1 - i;
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
    const nextDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    return { name: date.toLocaleString("en-US", { weekday: "short" }), date, nextDay };
  });

  const results = await Promise.all(
    ranges.map(({ date, nextDay }) =>
      db.booking.count({ where: { deletedAt: null, bookedAt: { gte: date, lt: nextDay } } })
    )
  );

  return ranges.map(({ name }, i) => ({ name, value: results[i] }));
}

export async function getPassengerGrowthTrend(months = 6): Promise<ChartDataPoint[]> {
  const now = new Date();
  const ranges = Array.from({ length: months }, (_, i) => {
    const offset = months - 1 - i;
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() - offset + 1, 1);
    return { name: date.toLocaleString("en-US", { month: "short" }), date, nextMonth };
  });

  const results = await Promise.all(
    ranges.map(({ date, nextMonth }) =>
      db.passenger.count({ where: { deletedAt: null, createdAt: { gte: date, lt: nextMonth } } })
    )
  );

  return ranges.map(({ name }, i) => ({ name, value: results[i] }));
}

export async function getOccupancyTrend(days = 7): Promise<ChartDataPoint[]> {
  const now = new Date();
  const ranges = Array.from({ length: days }, (_, i) => {
    const offset = days - 1 - i;
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
    const nextDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    return { name: date.toLocaleString("en-US", { weekday: "short" }), date, nextDay };
  });

  const results = await Promise.all(
    ranges.map(async ({ date, nextDay }) => {
      const [bookings, trips] = await Promise.all([
        db.booking.count({ where: { deletedAt: null, bookedAt: { gte: date, lt: nextDay } } }),
        db.trip.count({ where: { deletedAt: null, tripDate: { gte: date, lt: nextDay } } }),
      ]);
      const capacity = trips * 40;
      return capacity > 0 ? Math.round((bookings / capacity) * 100) : 0;
    })
  );

  return ranges.map(({ name }, i) => ({ name, value: results[i] }));
}

export async function getRoutePopularity(): Promise<ChartDataPoint[]> {
  const routes = await db.route.findMany({
    where: excludeDeleted(),
    select: {
      source: true,
      destination: true,
      schedules: {
        select: {
          trips: {
            select: { _count: { select: { bookings: true } } },
          },
        },
      },
    },
    take: 20,
  });

  return routes
    .map((route) => ({
      name: `${route.source} → ${route.destination}`,
      value: route.schedules.reduce(
        (acc, s) => acc + s.trips.reduce((a, t) => a + t._count.bookings, 0),
        0
      ),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}

export async function getRoutePerformance(): Promise<RoutePerformance[]> {
  const routes = await db.route.findMany({
    where: { ...excludeDeleted(), isActive: true },
    select: { id: true, source: true, destination: true },
    take: 8,
  });

  const performance = await Promise.all(
    routes.map(async (route) => {
      const [bookings, revenueAgg, tripCount] = await Promise.all([
        db.booking.count({
          where: {
            ...excludeDeleted(),
            status: { in: ["CONFIRMED", "COMPLETED"] },
            trip: { schedule: { routeId: route.id } },
          },
        }),
        db.payment.aggregate({
          where: {
            ...excludeDeleted(),
            status: "COMPLETED",
            booking: { trip: { schedule: { routeId: route.id } } },
          },
          _sum: { amount: true },
        }),
        db.trip.count({
          where: { ...excludeDeleted(), schedule: { routeId: route.id } },
        }),
      ]);
      const capacity = tripCount * 40;
      return {
        name: `${route.source} → ${route.destination}`,
        bookings,
        revenue: Number(revenueAgg._sum.amount || 0),
        occupancy: capacity > 0 ? Math.round((bookings / capacity) * 100) : 0,
      };
    })
  );

  return performance.sort((a, b) => b.bookings - a.bookings).slice(0, 6);
}

const fetchCompanyPerformance = unstable_cache(
  async (): Promise<ChartDataPoint[]> => {
    const companies = await db.busCompany.findMany({
      where: { ...excludeDeleted(), status: "ACTIVE", isNational: true },
      orderBy: { fleetSize: "desc" },
      take: 8,
      select: { name: true, fleetSize: true },
    });
    return companies.map((c) => ({ name: c.name.split(" ")[0], value: c.fleetSize }));
  },
  ["dashboard-company-performance"],
  { revalidate: 120 }
);

export async function getCompanyPerformance(): Promise<ChartDataPoint[]> {
  return fetchCompanyPerformance();
}

const fetchChartBundle = unstable_cache(
  async () => {
    const [
      revenueTrend,
      bookingTrend,
      passengerGrowth,
      occupancyTrend,
      routePopularity,
      routePerformance,
      companyPerformance,
    ] = await Promise.all([
      getRevenueTrend(),
      getBookingTrend(),
      getPassengerGrowthTrend(),
      getOccupancyTrend(),
      getRoutePopularity(),
      getRoutePerformance(),
      getCompanyPerformance(),
    ]);
    return {
      revenueTrend,
      bookingTrend,
      passengerGrowth,
      occupancyTrend,
      routePopularity,
      routePerformance,
      companyPerformance,
    };
  },
  ["dashboard-chart-bundle"],
  { revalidate: 60, tags: ["dashboard"] }
);

export async function getDashboardChartBundle() {
  return fetchChartBundle();
}
