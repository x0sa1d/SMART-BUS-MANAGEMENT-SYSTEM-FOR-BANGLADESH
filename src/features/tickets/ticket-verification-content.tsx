"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { lookupTicketForVerification, verifyTicket } from "@/actions/ticket.actions";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { ScanLine, CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import { QrScanner } from "./qr-scanner";

type LookupResult = NonNullable<
  Awaited<ReturnType<typeof lookupTicketForVerification>>["data"]
>;

export function TicketVerificationContent() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [serial, setSerial] = useState("");
  const [ticket, setTicket] = useState<LookupResult | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [pending, startTransition] = useTransition();

  const runLookup = useCallback((value: string) => {
    const query = value.trim();
    if (!query) {
      toast.error("Scan a QR code or enter serial / verification ID");
      return;
    }
    setInput(query);
    startTransition(async () => {
      const result = await lookupTicketForVerification(query);
      if (result.success && result.data) {
        setTicket(result.data);
        toast.success("Ticket found");
      } else {
        setTicket(null);
        toast.error(result.error ?? "Ticket not found");
      }
    });
  }, []);

  const handleLookup = () => {
    runLookup(serial.trim() || input);
  };

  const handleVerify = () => {
    const query = (serial.trim() || input).trim();
    if (!query) return;
    startTransition(async () => {
      const result = await verifyTicket(query);
      if (result.success) {
        toast.success(`Ticket ${result.data?.ticketNumber} verified`);
        setInput("");
        setSerial("");
        setTicket(null);
        setCameraOn(false);
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
          Scan the passenger ticket QR code, or enter the serial number / verification ID / ticket number.
          Each ticket can only be verified once.
        </p>
      </div>

      <Card className="card-elevated">
        <CardContent className="p-6 space-y-5">
          <QrScanner
            active={cameraOn}
            onActiveChange={setCameraOn}
            onScan={(value) => {
              setCameraOn(false);
              runLookup(value);
            }}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="serial-input">Serial Number</Label>
              <Input
                id="serial-input"
                placeholder="e.g. 123 45678 90123"
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLookup();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="verify-id-input">Verification / Ticket ID</Label>
              <Input
                id="verify-id-input"
                placeholder="VRF-... or SBM-..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLookup();
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Or paste full QR JSON</Label>
            <textarea
              className="flex min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder='{"v":"1","verificationId":"VRF-...","ticketNumber":"SBM-..."}'
              value={input.startsWith("{") ? input : ""}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleLookup} disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Lookup Ticket
            </Button>
            <Button
              variant="gradient"
              onClick={handleVerify}
              disabled={pending || !ticket || ticket.status === "VERIFIED"}
            >
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
            <p><span className="text-muted-foreground">Serial:</span> <span className="font-mono font-semibold">{ticket.serialNumber}</span></p>
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
