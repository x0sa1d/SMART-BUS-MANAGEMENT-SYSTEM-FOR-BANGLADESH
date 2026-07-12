import { revalidatePath } from "next/cache";

const SYSTEM_PATHS = [
  "/",
  "/search",
  "/dashboard",
  "/dashboard/users",
  "/dashboard/admins",
  "/dashboard/policies",
  "/dashboard/companies",
  "/dashboard/buses",
  "/dashboard/routes",
  "/dashboard/destinations",
  "/dashboard/schedules",
  "/dashboard/drivers",
  "/dashboard/passengers",
  "/dashboard/bookings",
  "/dashboard/ticket-verification",
  "/dashboard/payments",
  "/dashboard/maintenance",
  "/dashboard/reports",
  "/dashboard/analytics",
  "/dashboard/settings",
  "/passenger",
  "/passenger/search",
  "/passenger/destinations",
  "/passenger/bookings",
] as const;

export function revalidateSystem(extraPaths: string[] = []) {
  const paths = new Set<string>([...SYSTEM_PATHS, ...extraPaths]);
  for (const path of paths) {
    revalidatePath(path);
  }
}
