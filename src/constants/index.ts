export const APP_NAME = "Smart Bus Management";
export const APP_TAGLINE = "Bangladesh's #1 Digital Platform for Bus Operators, Routes & Online Ticketing";
export const APP_DESCRIPTION =
  "Nationwide bus management platform for 486+ operators across 64 districts — fleet tracking, online booking, bKash/Nagad payments, and real-time analytics.";

export { FARE_PER_KM_BDT } from "./operators";

export const ADMIN_NAV_ITEMS = [
  { title: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { title: "Companies", href: "/dashboard/companies", icon: "Building2" },
  { title: "Buses", href: "/dashboard/buses", icon: "Bus" },
  { title: "Routes", href: "/dashboard/routes", icon: "Route" },
  { title: "Destinations", href: "/dashboard/destinations", icon: "MapPin" },
  { title: "Schedules", href: "/dashboard/schedules", icon: "Calendar" },
  { title: "Drivers", href: "/dashboard/drivers", icon: "UserCog" },
  { title: "Passengers", href: "/dashboard/passengers", icon: "Users" },
  { title: "Bookings", href: "/dashboard/bookings", icon: "Ticket" },
  { title: "Ticket Verification", href: "/dashboard/ticket-verification", icon: "ScanLine" },
  { title: "Payments", href: "/dashboard/payments", icon: "CreditCard" },
  { title: "Maintenance", href: "/dashboard/maintenance", icon: "Wrench" },
  { title: "Reports", href: "/dashboard/reports", icon: "BarChart3" },
  { title: "Analytics", href: "/dashboard/analytics", icon: "TrendingUp" },
  { title: "Settings", href: "/dashboard/settings", icon: "Settings" },
] as const;

export const SUPER_ADMIN_NAV_ITEMS = [
  { title: "Users", href: "/dashboard/users", icon: "UsersRound" },
  { title: "Admins", href: "/dashboard/admins", icon: "ShieldCheck" },
] as const;

export type AdminNavItem = {
  title: string;
  href: string;
  icon: string;
};

export function getAdminNavItems(access: {
  isSuperAdmin: boolean;
  isPlatformAdmin: boolean;
  isCompanyAdmin: boolean;
}): AdminNavItem[] {
  if (access.isCompanyAdmin) {
    return [
      { title: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
      { title: "Buses", href: "/dashboard/buses", icon: "Bus" },
      { title: "Schedules", href: "/dashboard/schedules", icon: "Calendar" },
      { title: "Drivers", href: "/dashboard/drivers", icon: "UserCog" },
    ];
  }

  let base = [...ADMIN_NAV_ITEMS];
  const userNav = [
    { title: "Users", href: "/dashboard/users", icon: "UsersRound" },
    { title: "User Policies", href: "/dashboard/policies", icon: "Shield" },
  ];
  const adminNav = access.isSuperAdmin || access.isPlatformAdmin
    ? [{ title: "Admins", href: "/dashboard/admins", icon: "ShieldCheck" }]
    : [];

  return [
    base[0],
    ...userNav,
    ...adminNav,
    ...base.slice(1),
  ];
}

export const DRIVER_NAV_ITEMS = [
  { title: "Dashboard", href: "/driver", icon: "LayoutDashboard" },
  { title: "My Trips", href: "/driver/trips", icon: "Bus" },
  { title: "Maintenance", href: "/driver/maintenance", icon: "Wrench" },
  { title: "Profile", href: "/driver/profile", icon: "User" },
] as const;

export const PASSENGER_NAV_ITEMS = [
  { title: "Dashboard", href: "/passenger", icon: "LayoutDashboard" },
  { title: "Search Buses", href: "/passenger/search", icon: "Search" },
  { title: "Destinations", href: "/passenger/destinations", icon: "MapPin" },
  { title: "My Bookings", href: "/passenger/bookings", icon: "Ticket" },
  { title: "Track Bus", href: "/passenger/track", icon: "MapPin" },
  { title: "Profile", href: "/passenger/profile", icon: "User" },
] as const;

export const BUS_STATUSES = ["ACTIVE", "IN_MAINTENANCE", "AVAILABLE", "RUNNING"] as const;
export const BUS_TYPES = ["STANDARD", "DELUXE", "AC", "NON_AC"] as const;
export const TRIP_STATUSES = ["SCHEDULED", "BOARDING", "IN_TRANSIT", "COMPLETED", "CANCELLED", "DELAYED"] as const;
export const BOOKING_STATUSES = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"] as const;
export const SEAT_TYPES = ["REGULAR", "PREMIUM", "VIP"] as const;
export const PAYMENT_METHODS = ["CASH", "BKASH", "NAGAD", "ROCKET", "SSLCOMMERZ", "CARD"] as const;
export const PAYMENT_STATUSES = ["PENDING", "COMPLETED", "FAILED", "REFUNDED"] as const;

export const SEAT_COLORS = {
  AVAILABLE: { bg: "bg-green-500", text: "text-green-700", border: "border-green-500" },
  BOOKED: { bg: "bg-red-500", text: "text-red-700", border: "border-red-500" },
  RESERVED: { bg: "bg-yellow-500", text: "text-yellow-700", border: "border-yellow-500" },
  BLOCKED: { bg: "bg-gray-400", text: "text-gray-600", border: "border-gray-400" },
  SELECTED: { bg: "bg-primary", text: "text-primary", border: "border-primary" },
} as const;

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

export const PRICING_PLANS = [
  {
    name: "Starter",
    price: 4999,
    period: "month",
    description: "For small bus operators",
    features: ["Up to 10 buses", "Route management", "Online booking", "Basic reports"],
    highlighted: false,
  },
  {
    name: "Professional",
    price: 12999,
    period: "month",
    description: "For growing fleets",
    features: [
      "Up to 50 buses",
      "GPS tracking",
      "Payment gateways",
      "Analytics dashboard",
      "Driver management",
      "PDF & Excel exports",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: 29999,
    period: "month",
    description: "For large transportation companies",
    features: [
      "Unlimited buses",
      "AI demand prediction",
      "Multi-language support",
      "Custom branding",
      "Priority support",
      "API access",
    ],
    highlighted: false,
  },
] as const;
