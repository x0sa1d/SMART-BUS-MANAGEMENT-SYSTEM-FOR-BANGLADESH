import { db, excludeDeleted } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";

async function PaymentsList() {
  const payments = await db.payment.findMany({
    where: excludeDeleted(),
    include: { booking: { include: { passenger: true } } },
    orderBy: { createdAt: "desc" },
  });
  if (payments.length === 0) return <EmptyState title="No payments" description="Payments appear when tickets are booked." />;
  return (
    <div className="space-y-3">
      {payments.map((p) => (
        <Card key={p.id}><CardContent className="p-4 flex justify-between items-center">
          <div><p className="font-semibold">{p.booking.passenger.fullName}</p><p className="text-sm text-muted-foreground">{p.method} • {p.transactionId || "N/A"}</p></div>
          <div className="flex items-center gap-3"><Badge>{p.status}</Badge><span className="font-semibold">{formatCurrency(Number(p.amount))}</span></div>
        </CardContent></Card>
      ))}
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Payments</h1><p className="text-muted-foreground">Transaction history</p></div>
      <PaymentsList />
    </div>
  );
}
