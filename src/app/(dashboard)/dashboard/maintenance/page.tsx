import { db, excludeDeleted } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";

async function MaintenanceList() {
  const items = await db.maintenance.findMany({
    where: excludeDeleted(),
    include: { bus: true },
    orderBy: { scheduledAt: "desc" },
  });
  if (items.length === 0) return <EmptyState title="No maintenance records" description="Schedule maintenance for your buses." />;
  return (
    <div className="space-y-3">
      {items.map((m) => (
        <Card key={m.id}><CardContent className="p-4 flex justify-between items-center">
          <div><p className="font-semibold">{m.title}</p><p className="text-sm text-muted-foreground">{m.bus.busNumber} • {formatDate(m.scheduledAt)}</p></div>
          <div className="flex items-center gap-3"><Badge>{m.status}</Badge><span>{formatCurrency(Number(m.cost))}</span></div>
        </CardContent></Card>
      ))}
    </div>
  );
}

export default function MaintenancePage() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Maintenance</h1><p className="text-muted-foreground">Vehicle service records</p></div>
      <MaintenanceList />
    </div>
  );
}
