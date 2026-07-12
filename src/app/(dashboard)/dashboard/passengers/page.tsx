import { db, excludeDeleted } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";

async function PassengersList() {
  const passengers = await db.passenger.findMany({ where: excludeDeleted(), orderBy: { createdAt: "desc" } });
  if (passengers.length === 0) return <EmptyState title="No passengers" description="Passengers register when they book tickets." />;
  return (
    <div className="grid gap-3">
      {passengers.map((p) => (
        <Card key={p.id}><CardContent className="p-4 flex justify-between">
          <div><p className="font-semibold">{p.fullName}</p><p className="text-sm text-muted-foreground">{p.email} • {p.phone}</p></div>
          <span className="text-sm text-muted-foreground">{p.loyaltyPoints} pts</span>
        </CardContent></Card>
      ))}
    </div>
  );
}

export default function PassengersPage() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Passengers</h1><p className="text-muted-foreground">Registered passengers</p></div>
      <PassengersList />
    </div>
  );
}
