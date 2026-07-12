"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Ticket } from "lucide-react";

type BookingItem = {
  id: string; ticketNumber: string; status: string; fare: number; bookedAt: string;
  passenger: { fullName: string; phone: string };
  seat: { seatNumber: string; seatType: string };
  trip: { tripDate: string; schedule: { route: { source: string; destination: string } } };
  payment: { method: string; status: string } | null;
};

export function BookingsContent({ bookings }: { bookings: BookingItem[] }) {
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Bookings</h1><p className="text-muted-foreground">All ticket bookings</p></div>
      {bookings.length === 0 ? <EmptyState title="No bookings yet" description="Bookings will appear here." /> : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Card key={b.id}>
              <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2"><Ticket className="h-5 w-5 text-primary" /></div>
                  <div>
                    <p className="font-semibold">{b.ticketNumber}</p>
                    <p className="text-sm text-muted-foreground">{b.passenger.fullName} • Seat {b.seat.seatNumber} ({b.seat.seatType})</p>
                    <p className="text-xs text-muted-foreground">{b.trip.schedule.route.source} → {b.trip.schedule.route.destination} • {formatDate(b.trip.tripDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge>{b.status}</Badge>
                  <span className="font-semibold">{formatCurrency(b.fare)}</span>
                  {b.payment && <Badge variant="outline">{b.payment.method}</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
