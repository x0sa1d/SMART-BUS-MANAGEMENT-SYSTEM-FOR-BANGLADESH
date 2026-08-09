import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-server";
import { getETicketData } from "@/actions/ticket.actions";
import { BusTicketCard } from "@/features/tickets/bus-ticket-card";
import { DownloadTicketButton } from "@/features/passenger/download-ticket-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Printer } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PassengerTicketPage({
  params,
}: {
  params: Promise<{ ticketNumber: string }>;
}) {
  await requireAuth();
  const { ticketNumber } = await params;
  const result = await getETicketData(decodeURIComponent(ticketNumber));
  if (!result.success || !result.data) notFound();

  const t = result.data;

  return (
    <div className="space-y-6 page-enter">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" asChild className="px-0 hover:bg-transparent">
            <Link href="/passenger/bookings">
              <ArrowLeft className="h-4 w-4" /> Back to bookings
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Your Bus Ticket</h1>
          <p className="text-sm text-muted-foreground">
            Show the QR code or serial number at boarding for admin verification.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{t.status}</Badge>
          <span className="font-bold text-primary">{formatCurrency(t.fare)}</span>
          <DownloadTicketButton ticketNumber={t.ticketNumber} />
          <Button variant="outline" size="sm" asChild>
            <Link href="/passenger/track">
              <MapPin className="h-3.5 w-3.5" /> Track
            </Link>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="print:hidden"
            asChild
          >
            <a href={`/passenger/tickets/${encodeURIComponent(t.ticketNumber)}/print`} target="_blank" rel="noreferrer">
              <Printer className="h-3.5 w-3.5" /> Print
            </a>
          </Button>
        </div>
      </div>

      <BusTicketCard
        ticketNumber={t.ticketNumber}
        verificationId={t.verificationId}
        serialNumber={t.serialNumber}
        passengerName={t.passengerName}
        companyName={t.companyName}
        source={t.source}
        destination={t.destination}
        tripDate={t.tripDate}
        departureTime={t.departureTime}
        seatNumber={t.seatNumber}
        busNumber={t.busNumber}
        qrDataUrl={t.qrDataUrl}
      />
    </div>
  );
}
