import { db, excludeDeleted } from "@/lib/db";
import { requireDriver } from "@/lib/auth-server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";

export default async function DriverDashboardPage() {
  const session = await requireDriver();
  const driver = await db.driver.findFirst({ where: { userId: session.user.id, deletedAt: null } });
  if (!driver) return <EmptyState title="No driver profile" description="Contact admin to link your account." />;
  const trips = await db.trip.findMany({
    where: { driverId: driver.id, deletedAt: null },
    include: { schedule: { include: { route: true } }, bus: true },
    orderBy: { tripDate: "desc" },
    take: 10,
  });
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Driver Dashboard</h1><p className="text-muted-foreground">Welcome, {driver.fullName}</p></div>
      {trips.length === 0 ? <EmptyState title="No trips assigned" /> : (
        <div className="space-y-3">{trips.map((t) => (
          <Card key={t.id}><CardContent className="p-4 flex justify-between items-center">
            <div><p className="font-semibold">{t.schedule.route.source} → {t.schedule.route.destination}</p>
              <p className="text-sm text-muted-foreground">Bus {t.bus.busNumber} • {formatDate(t.tripDate)}</p></div>
            <Badge>{t.status}</Badge>
          </CardContent></Card>
        ))}</div>
      )}
    </div>
  );
}
