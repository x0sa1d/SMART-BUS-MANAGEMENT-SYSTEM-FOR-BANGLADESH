import { requireDriver } from "@/lib/auth-server";
import { AppLayoutClient } from "@/components/layout/app-layout";

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  await requireDriver();
  return <AppLayoutClient type="driver">{children}</AppLayoutClient>;
}
