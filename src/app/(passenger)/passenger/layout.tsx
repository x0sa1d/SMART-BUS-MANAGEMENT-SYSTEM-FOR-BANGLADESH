import { requirePassenger } from "@/lib/auth-server";
import { AppLayoutClient } from "@/components/layout/app-layout";
import { SosButton } from "@/features/sos/sos-button";

export default async function PassengerLayout({ children }: { children: React.ReactNode }) {
  await requirePassenger();
  return (
    <AppLayoutClient type="passenger">
      {children}
      <SosButton floating />
    </AppLayoutClient>
  );
}
