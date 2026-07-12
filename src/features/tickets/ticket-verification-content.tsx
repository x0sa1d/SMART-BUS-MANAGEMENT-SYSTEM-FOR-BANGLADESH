"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { lookupTicketForVerification, verifyTicket } from "@/actions/ticket.actions";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { ScanLine, CheckCircle2, Loader2, ShieldAlert } from "lucide-react";

type LookupResult = NonNullable<
  Awaited<ReturnType<typeof lookupTicketForVerification>>["data"]
>;

export function TicketVerificationContent() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [ticket, setTicket] = useState<LookupResult | null>(null);
  const [pending, startTransition] = useTransition();

  const handleLookup = () => {
    if (!input.trim()) {
      toast.error("Paste QR data or enter verification ID");
      return;
    }
    startTransition(async () => {
      const result = await lookupTicketForVerification(input);
      if (result.success && result.data) {
        setTicket(result.data);
      } else {
        setTicket(null);
        toast.error(result.error ?? "Ticket not found");
      }
    });
  };

  const handleVerify = () => {
    if (!input.trim()) return;
    startTransition(async () => {
      const result = await verifyTicket(input);
      if (result.success) {
        toast.success(`Ticket ${result.data?.ticketNumber} verified`);
        setInput("");
        setTicket(null);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ScanLine className="h-7 w-7 text-primary" />
          Ticket Verification
        </h1>
        <p className="text-muted-foreground">
          Scan a passenger QR code or enter the verification ID. Each ticket can only be verified once.
        </p>
      </div>

      <Card className="card-elevated">
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label>QR Code Data or Verification ID</Label>
            <textarea
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder='Paste QR JSON or enter VRF-... verification ID'
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleLookup} disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Lookup Ticket
            </Button>
            <Button variant="gradient" onClick={handleVerify} disabled={pending || !ticket || ticket.status === "VERIFIED"}>
              <CheckCircle2 className="h-4 w-4" />
              Verify & Mark Used
            </Button>
          </div>
        </CardContent>
      </Card>

      {ticket && (
        <Card className="card-elevated border-primary/20">
          <CardContent className="p-6 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <p className="font-semibold text-lg">{ticket.ticketNumber}</p>
              <Badge variant={ticket.status === "VERIFIED" ? "secondary" : "default"}>{ticket.status}</Badge>
            </div>
            <p><span className="text-muted-foreground">Verification ID:</span> {ticket.verificationId}</p>
            <p><span className="text-muted-foreground">Booking ID:</span> {ticket.bookingId}</p>
            <p><span className="text-muted-foreground">Passenger:</span> {ticket.passengerName}</p>
            <p><span className="text-muted-foreground">Operator:</span> {ticket.companyName}</p>
            <p><span className="text-muted-foreground">Route:</span> {ticket.route}</p>
            <p><span className="text-muted-foreground">Date / Time:</span> {ticket.tripDate} · {ticket.departureTime}</p>
            <p><span className="text-muted-foreground">Seat / Bus:</span> {ticket.seatNumber} · Bus {ticket.busNumber}</p>
            {ticket.verifiedAt && (
              <p className="flex items-center gap-2 text-amber-600">
                <ShieldAlert className="h-4 w-4" />
                Already verified on {formatDate(ticket.verifiedAt)}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
