"use client";

import { useState, useTransition, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { searchAvailableBuses } from "@/actions/passenger-search.actions";
import { createMultiSeatBooking, checkoutCart } from "@/actions/booking.actions";
import { useSession } from "@/lib/auth-client";
import { PAYMENT_METHODS, SEAT_COLORS, FARE_PER_KM_BDT } from "@/constants";
import { formatCurrency, cn, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { Search, Bus, Clock, MapPin, Ticket, CreditCard, Loader2, ShoppingBag } from "lucide-react";
import { useTicketCart } from "./use-ticket-cart";
import { TicketCartPanel } from "./ticket-cart-panel";
import type { BusCategory } from "@/types";

const BUS_CATEGORIES: { value: BusCategory; label: string }[] = [
  { value: "ALL", label: "All Buses" },
  { value: "AC", label: "AC" },
  { value: "NON_AC", label: "Non-AC" },
];

type Division = {
  id: string;
  name: string;
  districts: { id: string; name: string; code: string }[];
};

type TripSeat = {
  id: string;
  seatNumber: string;
  seatType: string;
  isAvailable: boolean;
};

type TripResult = {
  id: string;
  tripDate: string;
  status: string;
  availableCount: number;
  totalSeats: number;
  schedule: {
    departureTime: string;
    arrivalTime: string;
    fare: number;
    route: {
      name: string;
      source: string;
      destination: string;
      distance: number;
      estimatedDuration: number;
    };
    bus: { busNumber: string; busType: string; isAC: boolean };
    company: { id: string; name: string } | null;
    driver: { fullName: string };
  };
  seats: TripSeat[];
};

export function SearchBusesContent({
  divisions,
  initialDestination = "Chattogram",
  initialSource = "",
}: {
  divisions: Division[];
  initialDestination?: string;
  initialSource?: string;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const cart = useTicketCart();
  const [source, setSource] = useState(initialSource);
  const [destination, setDestination] = useState(initialDestination);
  const [travelDate, setTravelDate] = useState(new Date().toISOString().split("T")[0]);
  const [busCategory, setBusCategory] = useState<BusCategory>("ALL");
  const [trips, setTrips] = useState<TripResult[]>([]);
  const [usedFallback, setUsedFallback] = useState(false);
  const [fallbackDates, setFallbackDates] = useState<string[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<TripResult | null>(null);
  const [selectedSeatIds, setSelectedSeatIds] = useState<Set<string>>(new Set());
  const [paymentMethod, setPaymentMethod] = useState<string>("BKASH");
  const [phone, setPhone] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cartCheckoutOpen, setCartCheckoutOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchNonce, setSearchNonce] = useState(0);
  const [pending, startTransition] = useTransition();

  const allDistricts = useMemo(() => divisions.flatMap((d) => d.districts), [divisions]);
  const isLoggedIn = !!session?.user;

  const runSearch = useCallback((silent = false, force = false) => {
    if (!destination) {
      if (!silent) toast.error("Select a destination");
      return;
    }
    if (source && source === destination) {
      if (!silent) toast.error("Origin and destination must be different");
      return;
    }
    if (force) setSearchNonce((n) => n + 1);
    if (!silent) {
      setTrips([]);
      setSelectedTrip(null);
      setSelectedSeatIds(new Set());
    }
    startTransition(async () => {
      const result = await searchAvailableBuses({
        destination,
        date: travelDate,
        source: source || undefined,
        busCategory,
      });
      setTrips(result.trips);
      setUsedFallback(result.usedFallback);
      setFallbackDates(result.fallbackDates);
      setHasSearched(true);
      if (!silent) {
        setSelectedTrip(null);
        setSelectedSeatIds(new Set());
        if (result.trips.length === 0) {
          toast.info("No upcoming trips found for this route");
        } else if (result.usedFallback) {
          const today = new Date().toISOString().slice(0, 10);
          if (travelDate < today) {
            toast.info("Past dates unavailable. Showing upcoming trips from today.");
          } else {
            toast.info(`No buses on ${formatDate(travelDate)}. Showing ${result.trips.length} trip(s) in the next 5 days.`);
          }
        } else {
          toast.success(`Found ${result.trips.length} available trip(s)`);
        }
      }
    });
  }, [source, destination, travelDate, busCategory]);

  useEffect(() => {
    runSearch(true);
    // Initial load only — further updates require clicking Search
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hasSearched) return;
    const refresh = () => {
      if (document.visibilityState === "visible") runSearch(true);
    };
    const interval = window.setInterval(refresh, 60_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [hasSearched, runSearch]);

  const selectedSeats = useMemo(() => {
    if (!selectedTrip) return [];
    return selectedTrip.seats.filter((s) => selectedSeatIds.has(s.id));
  }, [selectedTrip, selectedSeatIds]);

  const selectedTotal = selectedTrip ? selectedSeats.length * selectedTrip.schedule.fare : 0;

  const toggleSeat = useCallback((seat: TripSeat) => {
    if (!seat.isAvailable) return;
    setSelectedSeatIds((prev) => {
      const next = new Set(prev);
      if (next.has(seat.id)) next.delete(seat.id);
      else next.add(seat.id);
      return next;
    });
  }, []);
  const tripsByDate = useMemo(() => {
    const groups = new Map<string, TripResult[]>();
    for (const trip of trips) {
      const key = trip.tripDate.slice(0, 10);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(trip);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [trips]);

  const openBooking = useCallback(() => {
    if (!selectedTrip || selectedSeats.length === 0) {
      toast.error("Select at least one seat");
      return;
    }
    if (!isLoggedIn) {
      toast.info("Please sign in to book a ticket");
      router.push(`/login?next=${encodeURIComponent("/passenger/search")}`);
      return;
    }
    setConfirmOpen(true);
  }, [selectedTrip, selectedSeats.length, isLoggedIn, router]);

  const handleAddToCart = useCallback(() => {
    if (!selectedTrip || selectedSeats.length === 0) {
      toast.error("Select at least one seat");
      return;
    }
    for (const seat of selectedSeats) {
      cart.addItem({
        tripId: selectedTrip.id,
        seatId: seat.id,
        seatNumber: seat.seatNumber,
        fare: selectedTrip.schedule.fare,
        tripDate: selectedTrip.tripDate,
        routeLabel: `${selectedTrip.schedule.route.source} → ${selectedTrip.schedule.route.destination}`,
        departureTime: selectedTrip.schedule.departureTime,
        busNumber: selectedTrip.schedule.bus.busNumber,
        companyName: selectedTrip.schedule.company?.name ?? "Operator",
      });
    }
    toast.success(`${selectedSeats.length} seat(s) added to cart`);
    setSelectedSeatIds(new Set());
  }, [selectedTrip, selectedSeats, cart]);

  const handleBook = useCallback(() => {
    if (!selectedTrip || selectedSeats.length === 0) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("tripId", selectedTrip.id);
      selectedSeats.forEach((seat) => fd.append("seatIds", seat.id));
      fd.set("paymentMethod", paymentMethod);
      if (phone) fd.set("phone", phone);

      const result = await createMultiSeatBooking(fd);
      if (result.success && result.data) {
        toast.success(`${result.data.count} ticket(s) booked!`);
        setConfirmOpen(false);
        setSelectedTrip(null);
        setSelectedSeatIds(new Set());
        runSearch(true);
        router.push("/passenger/bookings");
      } else {
        toast.error(result.error);
      }
    });
  }, [selectedTrip, selectedSeats, paymentMethod, phone, router, runSearch]);

  const handleCartCheckout = useCallback(() => {
    if (!isLoggedIn) {
      toast.info("Please sign in to checkout");
      router.push(`/login?next=${encodeURIComponent("/passenger/search")}`);
      return;
    }
    setCartCheckoutOpen(true);
  }, [isLoggedIn, router]);

  const handlePayCart = useCallback(() => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("items", JSON.stringify(cart.items.map((i) => ({ tripId: i.tripId, seatId: i.seatId }))));
      fd.set("paymentMethod", paymentMethod);
      if (phone) fd.set("phone", phone);

      const result = await checkoutCart(fd);
      if (result.success && result.data) {
        toast.success(`${result.data.count} ticket(s) booked!`);
        cart.clearCart();
        setCartCheckoutOpen(false);
        router.push("/passenger/bookings");
      } else {
        toast.error(result.error);
      }
    });
  }, [cart, paymentMethod, phone, router]);

  const districtInput = useCallback((
    value: string,
    onChange: (v: string) => void,
    label: string,
    optional = false
  ) => (
    <div className="space-y-2">
      <Label>{label}{optional ? " (optional)" : ""}</Label>
      <Input
        list="district-suggestions"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={optional ? "Type origin city or leave empty" : "Type destination city"}
        autoComplete="off"
      />
    </div>
  ), []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Search & Book Buses</h1>
          <p className="text-muted-foreground">
            View-only availability from Admin Management · filter AC/Non-AC · book via cart or direct pay
          </p>
        </div>
        <TicketCartPanel
          items={cart.items}
          total={cart.total}
          count={cart.count}
          onRemove={cart.removeItem}
          onCheckout={handleCartCheckout}
          checkoutDisabled={pending}
        />
      </div>

      <Card className="card-elevated">
        <CardContent className="p-6 space-y-4">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              runSearch(false, true);
            }}
          >
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            {districtInput(destination, setDestination, "Destination")}
            {districtInput(source, setSource, "From", true)}
            <datalist id="district-suggestions">
              {allDistricts.map((d) => (
                <option key={d.id} value={d.name} />
              ))}
            </datalist>
            <div className="space-y-2">
              <Label>Travel Date</Label>
              <Input
                type="date"
                value={travelDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setTravelDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Bus Category</Label>
              <Select value={busCategory} onValueChange={(v) => setBusCategory(v as BusCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BUS_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" variant="gradient" disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Select destination and date, then click Search · type any city or pick from suggestions
          </p>
          </form>
        </CardContent>
      </Card>

      {pending && trips.length === 0 && (
        <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Searching available buses…
        </div>
      )}

      {!pending && hasSearched && trips.length === 0 && (
        <Card className="card-elevated">
          <CardContent className="p-8 text-center text-muted-foreground">
            No trips match your search. Try another destination, date, or bus category.
          </CardContent>
        </Card>
      )}

      {trips.length > 0 && (
        <div className="space-y-4">
          {usedFallback && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
              {travelDate < new Date().toISOString().slice(0, 10) ? (
                <>Past travel dates are not available. Showing <strong>{trips.length}</strong> upcoming trip(s).</>
              ) : (
                <>
                  No buses available on <strong>{formatDate(travelDate)}</strong>.
                  Showing <strong>{trips.length}</strong> trip(s) across the next 5 days
                  {fallbackDates.length > 0 && (
                    <> ({fallbackDates.map((d) => formatDate(d)).join(", ")})</>
                  )}.
                </>
              )}
            </div>
          )}
          <h2 className="font-semibold flex items-center gap-2">
            Available Trips ({trips.length})
            {pending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </h2>
          <div key={searchNonce} className="space-y-4">
            {tripsByDate.map(([dateKey, dateTrips]) => (
              <div key={dateKey} className="space-y-3">
                {usedFallback && (
                  <h3 className="text-sm font-medium text-muted-foreground">{formatDate(dateKey)}</h3>
                )}
                {dateTrips.map((trip) => (
            <Card
              key={trip.id}
              className={cn(
                "card-elevated cursor-pointer transition-all hover:border-primary/40",
                selectedTrip?.id === trip.id && "ring-2 ring-primary border-primary/40"
              )}
              onClick={() => { setSelectedTrip(trip); setSelectedSeatIds(new Set()); }}
            >
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl gradient-primary p-2.5 text-white shrink-0">
                      <Bus className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold">{trip.schedule.route.source} → {trip.schedule.route.destination}</p>
                      {trip.schedule.company && (
                        <p className="text-sm text-primary font-medium">{trip.schedule.company.name}</p>
                      )}
                      <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {trip.schedule.departureTime} – {trip.schedule.arrivalTime}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {trip.schedule.route.distance} km</span>
                        <span>Bus {trip.schedule.bus.busNumber} • {trip.schedule.bus.busType}{trip.schedule.bus.isAC ? " • AC" : ""}</span>
                        {usedFallback && (
                          <span>{formatDate(trip.tripDate)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:text-right">
                    <div>
                      <p className="text-xs text-muted-foreground">{trip.availableCount} seats left</p>
                      <p className="text-xl font-bold text-primary">{formatCurrency(trip.schedule.fare)}</p>
                      <p className="text-[10px] text-muted-foreground">{trip.schedule.route.distance} km × {FARE_PER_KM_BDT} BDT</p>
                    </div>
                    <Badge variant={trip.availableCount > 0 ? "default" : "secondary"}>
                      {trip.availableCount > 0 ? "Available" : "Full"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedTrip && (
        <Card className="card-elevated border-primary/20">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Ticket className="h-5 w-5 text-primary" />
                Select Your Seat{selectedSeats.length > 0 ? ` (${selectedSeats.length})` : ""}
              </h3>
              <Badge variant="outline">{formatDate(selectedTrip.tripDate)}</Badge>
            </div>

            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground flex flex-wrap gap-4">
              <span className="flex items-center gap-1.5"><span className="h-4 w-4 rounded bg-green-500" /> Available</span>
              <span className="flex items-center gap-1.5"><span className="h-4 w-4 rounded bg-primary" /> Selected</span>
              <span className="flex items-center gap-1.5"><span className="h-4 w-4 rounded bg-red-500" /> Booked</span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-w-lg">
              {selectedTrip.seats.map((seat) => (
                <button
                  key={seat.id}
                  type="button"
                  disabled={!seat.isAvailable}
                  onClick={() => toggleSeat(seat)}
                  title={`Seat ${seat.seatNumber} (${seat.seatType})`}
                  className={cn(
                    "h-10 rounded-lg text-xs font-medium border transition-all",
                    !seat.isAvailable
                      ? `${SEAT_COLORS.BOOKED.bg} text-white cursor-not-allowed border-transparent`
                      : selectedSeatIds.has(seat.id)
                        ? `${SEAT_COLORS.SELECTED.bg} text-white border-transparent`
                        : "bg-green-100 hover:bg-green-200 dark:bg-green-900/30 border-green-300"
                  )}
                >
                  {seat.seatNumber}
                </button>
              ))}
            </div>

            {selectedSeats.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t">
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Phone (for ticket SMS)</Label>
                  <Input placeholder="01XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="gradient"
                className="flex-1"
                disabled={pending || selectedSeats.length === 0 || selectedTrip.availableCount === 0}
                onClick={openBooking}
              >
                <CreditCard className="h-4 w-4" />
                {isLoggedIn ? `Book ${selectedSeats.length || ""} Seat${selectedSeats.length !== 1 ? "s" : ""}` : "Sign in to Book"}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                disabled={pending || selectedSeats.length === 0}
                onClick={handleAddToCart}
              >
                <ShoppingBag className="h-4 w-4" />
                Add to Cart
              </Button>
              {selectedSeats.length > 0 && (
                <div className="text-sm text-muted-foreground sm:self-center">
                  Seats <strong>{selectedSeats.map((s) => s.seatNumber).join(", ")}</strong> • {formatCurrency(selectedTotal)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm Booking</DialogTitle></DialogHeader>
          {selectedTrip && selectedSeats.length > 0 && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
                <p><span className="text-muted-foreground">Operator:</span> {selectedTrip.schedule.company?.name ?? "—"}</p>
                <p><span className="text-muted-foreground">Route:</span> {selectedTrip.schedule.route.source} → {selectedTrip.schedule.route.destination}</p>
                <p><span className="text-muted-foreground">Date:</span> {formatDate(selectedTrip.tripDate)}</p>
                <p><span className="text-muted-foreground">Seats:</span> {selectedSeats.map((s) => s.seatNumber).join(", ")}</p>
                <p className="text-lg font-bold pt-2 border-t">Total: {formatCurrency(selectedTotal)}</p>
              </div>
              <Button variant="gradient" className="w-full" disabled={pending} onClick={handleBook}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Confirm & Pay
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={cartCheckoutOpen} onOpenChange={setCartCheckoutOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Checkout Cart ({cart.count} tickets)</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="max-h-48 overflow-y-auto space-y-2 text-sm">
              {cart.items.map((item) => (
                <div key={item.id} className="flex justify-between border-b pb-2">
                  <span>{item.routeLabel} · Seat {item.seatNumber}</span>
                  <span className="font-medium">{formatCurrency(item.fare)}</span>
                </div>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input placeholder="01XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            <p className="text-lg font-bold">Total: {formatCurrency(cart.total)}</p>
            <Button variant="gradient" className="w-full" disabled={pending} onClick={handlePayCart}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Pay {formatCurrency(cart.total)}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
