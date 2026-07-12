export type ActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type DashboardStats = {
  totalCompanies: number;
  activeCompanies: number;
  totalBuses: number;
  activeBuses: number;
  totalRoutes: number;
  activeRoutes: number;
  tripsToday: number;
  activeTrips: number;
  totalDrivers: number;
  totalPassengers: number;
  totalBookings: number;
  todayBookings: number;
  dailyRevenue: number;
  monthlyRevenue: number;
  totalRevenue: number;
  activeSchedules: number;
  pendingMaintenance: number;
  occupancyRate: number;
  passengerGrowth: number;
  totalTerminals: number;
  totalUpazilas: number;
};

export type ChartDataPoint = {
  name: string;
  value: number;
  [key: string]: string | number;
};

export type RoutePerformance = {
  name: string;
  bookings: number;
  revenue: number;
  occupancy: number;
};

export type BusCategory = "ALL" | "AC" | "NON_AC";
