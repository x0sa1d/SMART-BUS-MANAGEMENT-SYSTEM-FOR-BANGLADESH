import { requireDriver } from "@/lib/auth-server";
import { AppLayoutClient } from "@/components/layout/app-layout";
import { SosButton } from "@/features/sos/sos-button";

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  await requireDriver();
  return (
    <AppLayoutClient type="driver">
      {children}
      <SosButton floating />
    </AppLayoutClient>
  );
}
