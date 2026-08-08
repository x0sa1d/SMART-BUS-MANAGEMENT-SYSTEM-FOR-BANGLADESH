import { Suspense } from "react";
import { requireAuth } from "@/lib/auth-server";
import { getMyBookings } from "@/actions/booking.actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/skeleton-loaders";
import { DownloadTicketButton } from "@/features/passenger/download-ticket-button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Ticket, Search, MapPin } from "lucide-react";
import Link from "next/link";

async function BookingsList() {
  const bookings = await getMyBookings();

  if (bookings.length === 0) {
    return (
      <EmptyState
        title="No bookings yet"
        description="Search for buses and book your first ticket."
        action={
          <Button variant="gradient" asChild>
            <Link href="/passenger/search">Search Buses</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((b) => {
        const route = `${b.trip.schedule.route.source} → ${b.trip.schedule.route.destination}`;
        const companyName = b.trip.schedule.bus.company?.name;
        const ticketStatus = b.ticket?.status ?? "ISSUED";
        return (
          <Card key={b.id} className="card-elevated">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-xl gradient-primary p-2.5 text-white shrink-0">
                  <Ticket className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{b.ticketNumber}</p>
                  {companyName && <p className="text-sm text-primary">{companyName}</p>}
                  <p className="text-sm">{route}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Seat {b.seat.seatNumber} • {formatDate(b.trip.tripDate)} • {b.trip.schedule.departureTime}
                  </p>
                  {b.ticket?.verificationId && (
                    <p className="text-xs text-muted-foreground font-mono">ID: {b.ticket.verificationId}</p>
                  )}
                  {b.payment && (
                    <p className="text-xs text-muted-foreground">Paid via {b.payment.method}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:flex-col sm:items-end">
                <div className="flex gap-2">
                  <Badge variant={b.status === "CONFIRMED" ? "default" : "secondary"}>{b.status}</Badge>
                  <Badge variant={ticketStatus === "VERIFIED" ? "outline" : "secondary"}>{ticketStatus}</Badge>
                </div>
                <span className="font-bold text-primary">{formatCurrency(Number(b.fare))}</span>
                <div className="flex gap-2">
                  <DownloadTicketButton ticketNumber={b.ticketNumber} />
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/passenger/track"><MapPin className="h-3.5 w-3.5" /> Track</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default async function PassengerBookingsPage() {
  await requireAuth();

  return (
    <div className="space-y-6 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Bookings</h1>
          <p className="text-muted-foreground">E-tickets with QR codes. Download after payment</p>
        </div>
        <Button variant="gradient" asChild>
          <Link href="/passenger/search"><Search className="h-4 w-4" /> Book New Ticket</Link>
        </Button>
      </div>
      <Suspense fallback={<TableSkeleton rows={4} />}>
        <BookingsList />
      </Suspense>
    </div>
  );
}
