"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { getETicketData } from "@/actions/ticket.actions";
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
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>E-Ticket ${t.ticketNumber}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 480px; margin: 2rem auto; padding: 1.5rem; border: 2px solid #1e40af; border-radius: 12px; }
    h1 { color: #1e40af; margin: 0 0 .25rem; font-size: 1.25rem; }
    .sub { color: #64748b; margin-bottom: 1.5rem; }
    .row { display: flex; justify-content: space-between; padding: .35rem 0; border-bottom: 1px solid #e2e8f0; font-size: .9rem; }
    .label { color: #64748b; }
    .qr { text-align: center; margin: 1.5rem 0; }
    .qr img { width: 200px; height: 200px; }
    .status { display: inline-block; padding: .2rem .6rem; border-radius: 999px; background: #dbeafe; color: #1e40af; font-size: .75rem; font-weight: 600; }
    .footer { margin-top: 1.5rem; font-size: .75rem; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <h1>Smart Bus Management</h1>
  <p class="sub">Official E-Ticket</p>
  <div class="row"><span class="label">Passenger</span><strong>${t.passengerName}</strong></div>
  <div class="row"><span class="label">Operator</span><strong>${t.companyName}</strong></div>
  <div class="row"><span class="label">Route</span><strong>${t.route}</strong></div>
  <div class="row"><span class="label">Date</span><strong>${t.tripDate}</strong></div>
  <div class="row"><span class="label">Departure</span><strong>${t.departureTime}</strong></div>
  <div class="row"><span class="label">Seat</span><strong>${t.seatNumber}</strong></div>
  <div class="row"><span class="label">Ticket No.</span><strong>${t.ticketNumber}</strong></div>
  <div class="row"><span class="label">Booking ID</span><strong>${t.bookingId}</strong></div>
  <div class="row"><span class="label">Verification ID</span><strong>${t.verificationId}</strong></div>
  <div class="row"><span class="label">Status</span><span class="status">${t.status}</span></div>
  <div class="row"><span class="label">Fare</span><strong>${t.fare} BDT</strong></div>
  ${t.paymentMethod ? `<div class="row"><span class="label">Payment</span><strong>${t.paymentMethod}</strong></div>` : ""}
  <div class="qr">
    <img src="${t.qrDataUrl}" alt="Ticket QR Code" />
    <p>Scan at boarding for verification</p>
  </div>
  <p class="footer">Arrive 30 minutes before departure. This ticket is valid for one journey only.</p>
</body>
</html>`;

      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${t.ticketNumber}.html`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("E-ticket downloaded");
    });
  };

  return (
    <Button variant="outline" size="sm" onClick={handleDownload} disabled={pending}>
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
      E-Ticket
    </Button>
  );
}
