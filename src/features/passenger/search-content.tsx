"use client";

import { useState, useTransition, useMemo, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { searchAvailableBuses } from "@/actions/passenger-search.actions";
import { createMultiSeatBooking, checkoutCart } from "@/actions/booking.actions";
import { useSession } from "@/lib/auth-client";
import { PAYMENT_METHODS, SEAT_COLORS } from "@/constants";
import { formatCurrency, cn, formatDate } from "@/lib/utils";
import { addCalendarDays, calendarDateKey } from "@/lib/calendar-date";
import { FALLBACK_PASSENGER_CITIES, isSameCity } from "@/lib/district-search";
import { toast } from "sonner";
import {
  Search, Bus, Clock, MapPin, Ticket, CreditCard, Loader2, ShoppingBag, Sparkles,
  ArrowLeftRight, CalendarDays, Snowflake, X, ChevronDown, SlidersHorizontal,
} from "lucide-react";
import { useTicketCart } from "./use-ticket-cart";
import { TicketCartPanel } from "./ticket-cart-panel";
import type { BusCategory } from "@/types";
import {
  recommendSeatBlock,
  type SeatPreference,
} from "@/lib/seat-recommendation";

/** Today + 7 upcoming days on the date ribbon. */
const DATE_RIBBON_DAYS = 8;

type Division = {
  id: string;
  name: string;
  districts: { id: string; name: string; code: string }[];
};

type TripSeat = {
  id: string;
  seatNumber: string;
  seatType: string;
  row: number;
  column: number;
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

type SortKey = "price" | "time" | "seats";

const TIME_SLOTS = [
  { id: "early", label: "Early Morning", hint: "4AM-8AM", start: 4, end: 8 },
  { id: "morning", label: "Morning", hint: "8AM-12PM", start: 8, end: 12 },
  { id: "afternoon", label: "Afternoon", hint: "12PM-4PM", start: 12, end: 16 },
  { id: "night", label: "Night", hint: "4PM-8PM", start: 16, end: 20 },
  { id: "overnight", label: "Overnight", hint: "8PM-12AM", start: 20, end: 24 },
] as const;

const BUS_TYPE_FILTERS = ["SLEEPER", "DELUXE", "AC", "NON_AC", "STANDARD"] as const;

function parseHour(time: string): number {
  const [h] = time.split(":").map(Number);
  return Number.isFinite(h) ? h : 0;
}

function formatTime12h(time: string): string {
  const [hRaw, mRaw = "00"] = time.split(":");
  let h = Number(hRaw);
  const m = mRaw.padStart(2, "0");
  if (!Number.isFinite(h)) return time;
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${String(h).padStart(2, "0")}:${m} ${suffix}`;
}

function durationLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

function addDaysKey(base: string, days: number): string {
  return addCalendarDays(base, days);
}

function CitySuggestInput({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  const [open, setOpen] = useState(false);
  const suggestions = useMemo(() => {
    const q = value.trim().toLowerCase();
    const list = q
      ? options.filter((name) => name.toLowerCase().includes(q))
      : options;
    return list.slice(0, 8);
  }, [options, value]);

  return (
    <div className="relative min-w-0 flex-1">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-primary mb-1">{label}</p>
      <div className="relative">
        <input
          id={id}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 120);
          }}
          placeholder="Type a City"
          autoComplete="off"
          className="w-full min-h-11 rounded-lg border border-border bg-input px-3 pr-8 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        {value && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ink"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onChange("")}
            aria-label={`Clear ${label}`}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {open && suggestions.length > 0 && (
        <ul className="absolute z-40 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-border bg-white py-1 shadow-soft-lg">
          {suggestions.map((name) => (
            <li key={`${id}-${name}`}>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-primary/5"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(name);
                  setOpen(false);
                }}
              >
                <MapPin className="h-3.5 w-3.5 text-primary" />
                {name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SearchBusesContent({
  divisions,
  initialDestination = "",
  initialSource = "",
  initialDate,
  initialPassengers = 1,
}: {
  divisions: Division[];
  initialDestination?: string;
  initialSource?: string;
  initialDate?: string;
  initialPassengers?: number;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const cart = useTicketCart();
  const todayKey = calendarDateKey();
  const [source, setSource] = useState(initialSource);
  const [destination, setDestination] = useState(initialDestination);
  const [travelDate, setTravelDate] = useState(
    initialDate && initialDate >= todayKey ? initialDate : todayKey
  );
  const [passengerCount, setPassengerCount] = useState(
    Math.min(10, Math.max(1, initialPassengers || 1))
  );
  const [busCategory, setBusCategory] = useState<BusCategory>("ALL");
  const [trips, setTrips] = useState<TripResult[]>([]);
  const [usedFallback, setUsedFallback] = useState(false);
  const [fallbackDates, setFallbackDates] = useState<string[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<TripResult | null>(null);
  const [selectedSeatIds, setSelectedSeatIds] = useState<Set<string>>(new Set());
  const [seatPreference, setSeatPreference] = useState<SeatPreference>("any");
  const [aiReasons, setAiReasons] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("BKASH");
  const [phone, setPhone] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cartCheckoutOpen, setCartCheckoutOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchNonce, setSearchNonce] = useState(0);
  const [pending, startTransition] = useTransition();

  const [availableOnly, setAvailableOnly] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("time");
  const [selectedTimes, setSelectedTimes] = useState<Set<string>>(new Set());
  const [selectedBusTypes, setSelectedBusTypes] = useState<Set<string>>(new Set());
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
  const [companyQuery, setCompanyQuery] = useState("");
  const [boardingQuery, setBoardingQuery] = useState("");
  const [droppingQuery, setDroppingQuery] = useState("");
  const [selectedBoarding, setSelectedBoarding] = useState<Set<string>>(new Set());
  const [selectedDropping, setSelectedDropping] = useState<Set<string>>(new Set());
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const seatSectionRef = useRef<HTMLDivElement | null>(null);
  const allDistricts = useMemo(() => divisions.flatMap((d) => d.districts), [divisions]);
  const cityOptions = useMemo(
    () =>
      Array.from(new Set([...allDistricts.map((d) => d.name), ...FALLBACK_PASSENGER_CITIES])).sort((a, b) =>
        a.localeCompare(b)
      ),
    [allDistricts]
  );
  const isLoggedIn = !!session?.user;

  const dateRibbon = useMemo(
    () => Array.from({ length: DATE_RIBBON_DAYS }, (_, i) => addDaysKey(todayKey, i)),
    [todayKey]
  );

  const runSearch = useCallback((
    silent = false,
    force = false,
    overrides?: { date?: string; source?: string; destination?: string }
  ) => {
    const dest = (overrides?.destination ?? destination).trim();
    const from = (overrides?.source ?? source).trim();
    const date = overrides?.date ?? travelDate;
    if (!dest) {
      if (!silent) toast.error("Select Going To city");
      return;
    }
    if (!from) {
      if (!silent) toast.error("Select Depart From city");
      return;
    }
    if (isSameCity(from, dest)) {
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
        destination: dest,
        date,
        source: from,
        busCategory,
      });
      setTrips(result.trips);
      setUsedFallback(result.usedFallback);
      setFallbackDates(result.fallbackDates);
      setSearchError(result.error);
      setHasSearched(true);
      if (!silent) {
        setSelectedTrip(null);
        setSelectedSeatIds(new Set());
        if (result.error) {
          toast.error("Couldn't load available buses. Try search again.");
        } else if (result.trips.length === 0) {
          toast.info("No upcoming trips found for this route");
        } else if (result.usedFallback) {
          toast.info(`No buses on ${formatDate(date)}. Showing nearby dates.`);
        } else {
          toast.success(`Found ${result.trips.length} available bus(es)`);
        }
      }
    });
  }, [source, destination, travelDate, busCategory]);

  const autoSearchStarted = useRef(false);
  useEffect(() => {
    if (autoSearchStarted.current) return;
    if (!initialSource.trim() || !initialDestination.trim()) return;
    autoSearchStarted.current = true;
    runSearch(true, true);
  }, [initialSource, initialDestination, runSearch]);

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

  const companyOptions = useMemo(() => {
    const names = new Set<string>();
    for (const trip of trips) {
      if (trip.schedule.company?.name) names.add(trip.schedule.company.name);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [trips]);

  const boardingOptions = useMemo(
    () => Array.from(new Set(trips.map((t) => t.schedule.route.source))).sort(),
    [trips]
  );
  const droppingOptions = useMemo(
    () => Array.from(new Set(trips.map((t) => t.schedule.route.destination))).sort(),
    [trips]
  );

  const filteredTrips = useMemo(() => {
    let list = [...trips];
    if (availableOnly) list = list.filter((t) => t.availableCount >= passengerCount);
    if (busCategory === "AC") list = list.filter((t) => t.schedule.bus.isAC);
    if (busCategory === "NON_AC") list = list.filter((t) => !t.schedule.bus.isAC);
    if (selectedTimes.size > 0) {
      list = list.filter((t) => {
        const hour = parseHour(t.schedule.departureTime);
        return TIME_SLOTS.some(
          (slot) => selectedTimes.has(slot.id) && hour >= slot.start && hour < slot.end
        );
      });
    }
    if (selectedBusTypes.size > 0) {
      list = list.filter((t) => {
        const type = t.schedule.bus.busType.toUpperCase();
        const acTag = t.schedule.bus.isAC ? "AC" : "NON_AC";
        return selectedBusTypes.has(type) || selectedBusTypes.has(acTag);
      });
    }
    if (selectedCompanies.size > 0) {
      list = list.filter((t) => t.schedule.company && selectedCompanies.has(t.schedule.company.name));
    }
    if (selectedBoarding.size > 0) {
      list = list.filter((t) => selectedBoarding.has(t.schedule.route.source));
    }
    if (selectedDropping.size > 0) {
      list = list.filter((t) => selectedDropping.has(t.schedule.route.destination));
    }

    list.sort((a, b) => {
      if (sortKey === "price") return a.schedule.fare - b.schedule.fare;
      if (sortKey === "seats") return b.availableCount - a.availableCount;
      return a.schedule.departureTime.localeCompare(b.schedule.departureTime);
    });
    return list;
  }, [
    trips,
    availableOnly,
    passengerCount,
    busCategory,
    selectedTimes,
    selectedBusTypes,
    selectedCompanies,
    selectedBoarding,
    selectedDropping,
    sortKey,
  ]);

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
      else {
        if (next.size >= passengerCount) {
          toast.info(`You selected ${passengerCount} passenger${passengerCount > 1 ? "s" : ""}. Remove a seat to change selection.`);
          return prev;
        }
        next.add(seat.id);
      }
      return next;
    });
    setAiReasons([]);
  }, [passengerCount]);

  const applyAiRecommendation = useCallback((count = passengerCount) => {
    if (!selectedTrip) return;
    const picks = recommendSeatBlock(
      selectedTrip.seats.map((s) => ({
        id: s.id,
        seatNumber: s.seatNumber,
        seatType: s.seatType,
        row: s.row ?? 1,
        column: s.column ?? 1,
        isAvailable: s.isAvailable,
      })),
      count,
      seatPreference
    );
    if (picks.length === 0) {
      toast.error("No available seats to recommend");
      return;
    }
    setSelectedSeatIds(new Set(picks.map((p) => p.seatId)));
    setAiReasons(picks.flatMap((p) => p.reasons.map((r) => `${p.seatNumber}: ${r}`)));
    toast.success(`AI recommended ${picks.map((p) => p.seatNumber).join(", ")}`);
  }, [selectedTrip, seatPreference, passengerCount]);

  const openBooking = useCallback(() => {
    if (!selectedTrip || selectedSeats.length === 0) {
      toast.error("Select at least one seat");
      return;
    }
    if (selectedSeats.length < passengerCount) {
      toast.error(`Select ${passengerCount} seat${passengerCount > 1 ? "s" : ""} for your passengers`);
      return;
    }
    if (!isLoggedIn) {
      toast.info("Please sign in to book a ticket");
      const nextPath = typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : "/passenger/search";
      router.push(`/login?next=${encodeURIComponent(nextPath)}`);
      return;
    }
    setConfirmOpen(true);
  }, [selectedTrip, selectedSeats.length, passengerCount, isLoggedIn, router]);

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
        const firstTicket = result.data.ticketNumbers?.[0];
        router.push(
          firstTicket
            ? `/passenger/tickets/${encodeURIComponent(firstTicket)}`
            : "/passenger/bookings"
        );
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
        const firstTicket = result.data.ticketNumbers?.[0];
        router.push(
          firstTicket
            ? `/passenger/tickets/${encodeURIComponent(firstTicket)}`
            : "/passenger/bookings"
        );
      } else {
        toast.error(result.error);
      }
    });
  }, [cart, paymentMethod, phone, router]);

  const swapCities = () => {
    const nextSource = destination;
    const nextDestination = source;
    setSource(nextSource);
    setDestination(nextDestination);
    if (hasSearched && nextSource.trim() && nextDestination.trim() && !isSameCity(nextSource, nextDestination)) {
      runSearch(false, true, { source: nextSource, destination: nextDestination });
    }
  };

  const clearFilters = () => {
    setBusCategory("ALL");
    setSelectedTimes(new Set());
    setSelectedBusTypes(new Set());
    setSelectedCompanies(new Set());
    setSelectedBoarding(new Set());
    setSelectedDropping(new Set());
    setAvailableOnly(true);
    setCompanyQuery("");
    setBoardingQuery("");
    setDroppingQuery("");
  };

  const toggleSetValue = (set: Set<string>, value: string, updater: (next: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    updater(next);
  };

  const viewSeats = (trip: TripResult) => {
    setSelectedTrip(trip);
    setSelectedSeatIds(new Set());
    setAiReasons([]);
    setTimeout(() => seatSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  return (
    <div className="space-y-4 max-w-full overflow-x-hidden">
      {/* Top search bar */}
      <form
        className="rounded-xl border border-border bg-white p-3 sm:p-4 shadow-soft"
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(false, true);
        }}
      >
        <div className="flex flex-col xl:flex-row gap-3 xl:items-end">
          <div className="flex flex-1 flex-col sm:flex-row gap-2 sm:items-end">
            <CitySuggestInput
              id="depart-from"
              label="Depart From"
              value={source}
              onChange={setSource}
              options={cityOptions}
            />
            <button
              type="button"
              onClick={swapCities}
              className="mx-auto sm:mb-2 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white text-primary hover:bg-primary/5"
              aria-label="Swap cities"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </button>
            <CitySuggestInput
              id="going-to"
              label="Going To"
              value={destination}
              onChange={setDestination}
              options={cityOptions}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 xl:w-[420px]">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-primary mb-1">Journey Date</p>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="date"
                  min={todayKey}
                  max={addDaysKey(todayKey, DATE_RIBBON_DAYS - 1)}
                  value={travelDate}
                  onChange={(e) => {
                    const next = e.target.value;
                    setTravelDate(next);
                    if (hasSearched && source.trim() && destination.trim()) {
                      runSearch(true, false, { date: next });
                    }
                  }}
                  className="w-full min-h-11 rounded-lg border border-border bg-input pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Return Date</p>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  readOnly
                  value="Book to Save Extra"
                  className="w-full min-h-11 rounded-lg border border-dashed border-border bg-muted/40 pl-9 pr-3 text-sm text-muted-foreground"
                />
              </div>
            </div>
            <div className="min-w-0 col-span-2 sm:col-span-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-primary mb-1">Passenger(s)</p>
              <select
                value={passengerCount}
                onChange={(e) => setPassengerCount(Number(e.target.value))}
                className="w-full min-h-11 rounded-lg border border-border bg-input px-3 text-sm outline-none focus:border-primary"
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="h-12 w-full xl:w-14 shrink-0 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center shadow-soft"
            aria-label="Search buses"
          >
            {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
          </button>
        </div>
      </form>

      {/* Date ribbon */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {dateRibbon.map((key) => {
          const [year, month, day] = key.split("-").map(Number);
          const d = new Date(Date.UTC(year, month - 1, day));
          const label = d
            .toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", timeZone: "UTC" })
            .toUpperCase();
          const active = key === travelDate;
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setTravelDate(key);
                if (source.trim() && destination.trim()) {
                  runSearch(false, true, { date: key });
                }
              }}
              className={cn(
                "min-w-[72px] rounded-lg border px-3 py-2 text-xs font-semibold transition-colors",
                active
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-white text-muted-foreground hover:border-primary/40"
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="flex justify-end">
        <TicketCartPanel
          items={cart.items}
          total={cart.total}
          count={cart.count}
          onRemove={cart.removeItem}
          onCheckout={handleCartCheckout}
          checkoutDisabled={pending}
        />
      </div>

      <div className="flex justify-end lg:hidden">
        <button
          type="button"
          onClick={() => setMobileFiltersOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-[10px] border border-border bg-white px-4 py-2 text-sm font-semibold text-ink shadow-soft min-h-11"
        >
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          {mobileFiltersOpen ? "Hide filters" : "Filters & sort"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[min(100%,280px)_1fr] gap-4 items-start">
        {/* Filters */}
        <aside
          className={cn(
            "rounded-xl border border-border bg-white p-4 space-y-4 shadow-soft lg:sticky lg:top-20",
            mobileFiltersOpen ? "block" : "hidden lg:block"
          )}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-ink">All Filters</h2>
            <button type="button" onClick={clearFilters} className="text-xs font-semibold text-primary hover:underline">
              Clear All
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-ink">AC / Non-AC</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setBusCategory(busCategory === "AC" ? "ALL" : "AC")}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm font-medium flex items-center justify-center gap-1.5",
                  busCategory === "AC" ? "border-primary bg-[#E5EFE9] text-primary" : "border-border"
                )}
              >
                <Snowflake className="h-4 w-4" /> AC
              </button>
              <button
                type="button"
                onClick={() => setBusCategory(busCategory === "NON_AC" ? "ALL" : "NON_AC")}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm font-medium",
                  busCategory === "NON_AC" ? "border-primary bg-[#E5EFE9] text-primary" : "border-border"
                )}
              >
                NON AC
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-ink">Bus Type</p>
            <div className="flex flex-wrap gap-2">
              {BUS_TYPE_FILTERS.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleSetValue(selectedBusTypes, type, setSelectedBusTypes)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium",
                    selectedBusTypes.has(type) ? "border-primary bg-[#E5EFE9] text-primary" : "border-border"
                  )}
                >
                  {type.replace("_", "-")}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-ink">Time</p>
            <div className="space-y-1.5">
              {TIME_SLOTS.map((slot) => (
                <label key={slot.id} className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-2 text-sm cursor-pointer hover:bg-muted/40">
                  <Checkbox
                    checked={selectedTimes.has(slot.id)}
                    onCheckedChange={() => toggleSetValue(selectedTimes, slot.id, setSelectedTimes)}
                  />
                  <span className="flex-1">
                    {slot.label}
                    <span className="block text-[11px] text-muted-foreground">{slot.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-ink">Bus Company</p>
            <Input
              value={companyQuery}
              onChange={(e) => setCompanyQuery(e.target.value)}
              placeholder="Search Bus company"
              className="h-9"
            />
            <div className="max-h-40 overflow-y-auto space-y-1">
              {companyOptions
                .filter((name) => name.toLowerCase().includes(companyQuery.toLowerCase()))
                .map((name) => (
                  <label key={name} className="flex items-center gap-2 text-sm px-1 py-1 cursor-pointer">
                    <Checkbox
                      checked={selectedCompanies.has(name)}
                      onCheckedChange={() => toggleSetValue(selectedCompanies, name, setSelectedCompanies)}
                    />
                    <span className="truncate">{name}</span>
                  </label>
                ))}
              {companyOptions.length === 0 && (
                <p className="text-xs text-muted-foreground">Search to load companies</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-ink">Boarding Point</p>
            <Input
              value={boardingQuery}
              onChange={(e) => setBoardingQuery(e.target.value)}
              placeholder="Search Boarding point"
              className="h-9"
            />
            <div className="max-h-32 overflow-y-auto space-y-1">
              {boardingOptions
                .filter((name) => name.toLowerCase().includes(boardingQuery.toLowerCase()))
                .map((name) => (
                  <label key={name} className="flex items-center gap-2 text-sm px-1 py-1 cursor-pointer">
                    <Checkbox
                      checked={selectedBoarding.has(name)}
                      onCheckedChange={() => toggleSetValue(selectedBoarding, name, setSelectedBoarding)}
                    />
                    <span className="truncate">{name}</span>
                  </label>
                ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-ink">Dropping Point</p>
            <Input
              value={droppingQuery}
              onChange={(e) => setDroppingQuery(e.target.value)}
              placeholder="Search Dropping point"
              className="h-9"
            />
            <div className="max-h-32 overflow-y-auto space-y-1">
              {droppingOptions
                .filter((name) => name.toLowerCase().includes(droppingQuery.toLowerCase()))
                .map((name) => (
                  <label key={name} className="flex items-center gap-2 text-sm px-1 py-1 cursor-pointer">
                    <Checkbox
                      checked={selectedDropping.has(name)}
                      onCheckedChange={() => toggleSetValue(selectedDropping, name, setSelectedDropping)}
                    />
                    <span className="truncate">{name}</span>
                  </label>
                ))}
            </div>
          </div>
        </aside>

        {/* Results */}
        <section className="space-y-3 min-w-0">
          <div className="rounded-xl border border-border bg-white px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-soft">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="font-bold text-ink">
                Buses ({hasSearched ? filteredTrips.length : 0} Buses)
              </h2>
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <Checkbox checked={availableOnly} onCheckedChange={(v) => setAvailableOnly(Boolean(v))} />
                Available Buses Only
              </label>
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {([
                ["price", "Price"],
                ["time", "Time"],
                ["seats", "Seats"],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSortKey(key)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-semibold",
                    sortKey === key ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {searchError && hasSearched && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-ink">
              Couldn&apos;t load available buses. Check your connection and click Search again.
            </div>
          )}

          {usedFallback && hasSearched && !searchError && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-50 px-4 py-3 text-sm text-ink">
              No buses on <strong>{formatDate(travelDate)}</strong>. Showing nearby dates
              {fallbackDates.length > 0 && <> ({fallbackDates.map((d) => formatDate(d)).join(", ")})</>}.
            </div>
          )}

          {pending && trips.length === 0 && (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Searching available buses…
            </div>
          )}

          {!pending && !hasSearched && (
            <Card className="border-dashed">
              <CardContent className="p-10 text-center text-muted-foreground">
                Enter cities and date, then click Search to see available buses.
              </CardContent>
            </Card>
          )}

          {!pending && hasSearched && filteredTrips.length === 0 && (
            <Card>
              <CardContent className="p-10 text-center text-muted-foreground">
                {searchError
                  ? "Available buses could not be loaded right now."
                  : trips.length === 0
                    ? "No upcoming buses for this route. Try another date or city."
                    : "No buses match your filters. Try clearing filters or another date."}
              </CardContent>
            </Card>
          )}

          <div key={searchNonce} className="space-y-3">
            {filteredTrips.map((trip) => {
              const listFare = trip.schedule.fare;
              const fakeMrp = Math.round(listFare * 1.2);
              const savings = fakeMrp - listFare;
              return (
                <article
                  key={trip.id}
                  className={cn(
                    "overflow-hidden rounded-xl border bg-white shadow-soft transition-all",
                    selectedTrip?.id === trip.id ? "border-primary ring-2 ring-primary/25" : "border-border"
                  )}
                >
                  <div className="h-1.5 bg-primary" />
                  <div className="p-4 grid grid-cols-1 md:grid-cols-[1.2fr_1.4fr_0.9fr] gap-4 items-center">
                    <div className="space-y-1 min-w-0">
                      <p className="font-bold text-ink text-lg truncate">
                        {trip.schedule.company?.name || "Bus Operator"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {trip.schedule.bus.busNumber} · {trip.schedule.bus.busType}
                        {trip.schedule.bus.isAC ? " · AC" : " · Non-AC"}
                      </p>
                      <button type="button" className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1">
                        Boarding / Dropping Point <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 min-w-0">
                      <div className="min-w-0">
                        <p className="text-xl font-bold text-ink">{formatTime12h(trip.schedule.departureTime)}</p>
                        <p className="text-xs text-muted-foreground truncate">{trip.schedule.route.source}</p>
                      </div>
                      <div className="flex-1 text-center px-2">
                        <p className="text-xs text-muted-foreground">{durationLabel(trip.schedule.route.estimatedDuration || 0)}</p>
                        <div className="relative my-1 h-px bg-border">
                          <Bus className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 bg-white text-primary" />
                        </div>
                        <div className="flex justify-center gap-2 text-[11px] font-medium text-muted-foreground">
                          {trip.schedule.bus.isAC && <span className="rounded bg-[#E5EFE9] px-1.5 py-0.5 text-primary">AC</span>}
                          <span className="rounded bg-[#F7F3E9] px-1.5 py-0.5 text-ink">{trip.schedule.bus.busType}</span>
                        </div>
                      </div>
                      <div className="min-w-0 text-right">
                        <p className="text-xl font-bold text-ink">{formatTime12h(trip.schedule.arrivalTime)}</p>
                        <p className="text-xs text-muted-foreground truncate">{trip.schedule.route.destination}</p>
                      </div>
                    </div>

                    <div className="flex md:flex-col items-center md:items-end justify-between gap-2">
                      <div className="text-left md:text-right">
                        <p className="text-xs text-muted-foreground">Seats left: {trip.availableCount}</p>
                        {savings > 0 && (
                          <Badge className="bg-[#27845B]/12 text-[#27845B] hover:bg-[#27845B]/12 mb-1">
                            Savings {formatCurrency(savings)}
                          </Badge>
                        )}
                        <p className="text-xs text-muted-foreground line-through">{formatCurrency(fakeMrp)}</p>
                        <p className="text-2xl font-extrabold text-accent">{formatCurrency(listFare)}</p>
                      </div>
                      <Button
                        type="button"
                        className="rounded-lg bg-primary hover:bg-primary/90 text-white border-0 min-w-[120px]"
                        onClick={() => viewSeats(trip)}
                        disabled={trip.availableCount === 0}
                      >
                        View Seats
                      </Button>
                    </div>
                  </div>
                  {usedFallback && (
                    <div className="border-t px-4 py-2 text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {formatDate(trip.tripDate)}
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {selectedTrip && (
            <Card ref={seatSectionRef} className="border-primary/25 shadow-soft-lg">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h3 className="font-semibold flex items-center gap-2 text-ink">
                    <Ticket className="h-5 w-5 text-primary" />
                    Select Your Seat{selectedSeats.length > 0 ? ` (${selectedSeats.length})` : ""}
                  </h3>
                  <Badge variant="outline">{formatDate(selectedTrip.tripDate)}</Badge>
                </div>

                <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground flex flex-wrap gap-4">
                  <span className="flex items-center gap-1.5"><span className="h-4 w-4 rounded border border-[#E8E2D5] bg-white" /> Available</span>
                  <span className="flex items-center gap-1.5"><span className="h-4 w-4 rounded bg-primary" /> Selected</span>
                  <span className="flex items-center gap-1.5"><span className="h-4 w-4 rounded bg-[#D9D9D3]" /> Booked</span>
                  <span className="flex items-center gap-1.5"><span className="h-4 w-4 rounded bg-[#E9A23B]" /> AI pick</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end rounded-xl border border-primary/25 bg-primary/5 p-4">
                  <div className="space-y-2 flex-1">
                    <Label className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" /> AI Seat Preference
                    </Label>
                    <Select value={seatPreference} onValueChange={(v) => setSeatPreference(v as SeatPreference)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Best overall</SelectItem>
                        <SelectItem value="window">Window</SelectItem>
                        <SelectItem value="aisle">Aisle</SelectItem>
                        <SelectItem value="front">Front / quick exit</SelectItem>
                        <SelectItem value="back">Quiet rear</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="button" variant="outline" onClick={() => applyAiRecommendation(1)}>
                    <Sparkles className="h-4 w-4" /> Recommend 1
                  </Button>
                  <Button
                    type="button"
                    className="bg-primary hover:bg-primary/90 text-white border-0"
                    onClick={() => applyAiRecommendation(passengerCount)}
                  >
                    <Sparkles className="h-4 w-4" /> Recommend {passengerCount}
                  </Button>
                </div>

                {aiReasons.length > 0 && (
                  <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
                    {aiReasons.slice(0, 6).map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                )}

                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-w-lg">
                  {selectedTrip.seats.map((seat) => (
                    <button
                      key={seat.id}
                      type="button"
                      disabled={!seat.isAvailable}
                      onClick={() => toggleSeat(seat)}
                      title={`Seat ${seat.seatNumber} (${seat.seatType})`}
                      className={cn(
                        "h-11 min-h-11 rounded-[10px] text-xs font-medium border transition-all",
                        !seat.isAvailable
                          ? `${SEAT_COLORS.BOOKED.bg} ${SEAT_COLORS.BOOKED.text} cursor-not-allowed border-transparent`
                          : selectedSeatIds.has(seat.id)
                            ? aiReasons.some((r) => r.startsWith(seat.seatNumber))
                              ? "bg-[#E9A23B] text-white border-transparent ring-2 ring-[#E9A23B]/40"
                              : "bg-primary text-white border-transparent"
                            : "bg-white hover:bg-[#E5EFE9] border-[#E8E2D5] text-ink"
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
                    className="flex-1 bg-primary hover:bg-primary/90 text-white border-0"
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
                      Seats <strong>{selectedSeats.map((s) => s.seatNumber).join(", ")}</strong> · {formatCurrency(selectedTotal)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm Booking</DialogTitle></DialogHeader>
          {selectedTrip && selectedSeats.length > 0 && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
                <p><span className="text-muted-foreground">Operator:</span> {selectedTrip.schedule.company?.name ?? "-"}</p>
                <p><span className="text-muted-foreground">Route:</span> {selectedTrip.schedule.route.source} → {selectedTrip.schedule.route.destination}</p>
                <p><span className="text-muted-foreground">Date:</span> {formatDate(selectedTrip.tripDate)}</p>
                <p><span className="text-muted-foreground">Seats:</span> {selectedSeats.map((s) => s.seatNumber).join(", ")}</p>
                <p className="text-lg font-bold pt-2 border-t">Total: {formatCurrency(selectedTotal)}</p>
              </div>
              <Button className="w-full bg-primary hover:bg-primary/90 text-white border-0" disabled={pending} onClick={handleBook}>
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
            <Button className="w-full bg-primary hover:bg-primary/90 text-white border-0" disabled={pending} onClick={handlePayCart}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Pay {formatCurrency(cart.total)}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
