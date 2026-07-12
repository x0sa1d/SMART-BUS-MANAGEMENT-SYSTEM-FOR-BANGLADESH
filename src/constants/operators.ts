import { REGISTERED_COMPANIES } from "./company-registry";

export const MAJOR_OPERATORS = REGISTERED_COMPANIES.slice(0, 24);

export const POPULAR_ROUTES = [
  { from: "Dhaka", to: "Chattogram", distance: "248 km", duration: "6-7 hrs" },
  { from: "Dhaka", to: "Sylhet", distance: "245 km", duration: "5-6 hrs" },
  { from: "Dhaka", to: "Cox's Bazar", distance: "414 km", duration: "10-12 hrs" },
  { from: "Dhaka", to: "Khulna", distance: "333 km", duration: "7-8 hrs" },
  { from: "Dhaka", to: "Rajshahi", distance: "256 km", duration: "5-6 hrs" },
  { from: "Dhaka", to: "Rangpur", distance: "330 km", duration: "7-8 hrs" },
  { from: "Dhaka", to: "Barishal", distance: "195 km", duration: "4-5 hrs" },
  { from: "Dhaka", to: "Mymensingh", distance: "122 km", duration: "2-3 hrs" },
] as const;

export const COVERAGE_STATS = [
  { label: "Bus Operators", value: "486+" },
  { label: "Districts", value: "64" },
  { label: "Bus Routes", value: "258+" },
  { label: "Terminals", value: "67+" },
  { label: "Upazilas", value: "250+" },
  { label: "Divisions", value: "8" },
] as const;

export const PAYMENT_METHODS = [
  { name: "bKash", color: "bg-pink-500" },
  { name: "Nagad", color: "bg-orange-500" },
  { name: "Rocket", color: "bg-purple-500" },
  { name: "SSLCommerz", color: "bg-blue-600" },
  { name: "Cards", color: "bg-slate-700" },
] as const;

export const FARE_PER_KM_BDT = 3;
