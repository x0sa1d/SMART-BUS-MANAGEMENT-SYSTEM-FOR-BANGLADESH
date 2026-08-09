"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { getETicketData } from "@/actions/ticket.actions";
import { buildBusTicketHtml } from "@/lib/bus-ticket-html";
import { toast } from "sonner";

export function DownloadTicketButton({ ticketNumber }: { ticketNumber: string }) {
  const [pending, startTransition] = useTransition();

  const handleDownload = () => {
    startTransition(async () => {
      const result = await getETicketData(ticketNumber);
      if (!result.success || !result.data) {
        toast.error(result.error ?? "Could not load ticket");
        return;
      }

      const t = result.data;
      const html = buildBusTicketHtml({
        ticketNumber: t.ticketNumber,
        verificationId: t.verificationId,
        serialNumber: t.serialNumber,
        passengerName: t.passengerName,
        companyName: t.companyName,
        source: t.source,
        destination: t.destination,
        tripDate: t.tripDate,
        departureTime: t.departureTime,
        seatNumber: t.seatNumber,
        busNumber: t.busNumber,
        fare: t.fare,
        qrDataUrl: t.qrDataUrl,
        status: t.status,
      });

      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${t.ticketNumber}.html`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Bus ticket downloaded");
    });
  };

  return (
    <Button variant="outline" size="sm" onClick={handleDownload} disabled={pending}>
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
      E-Ticket
    </Button>
  );
}
