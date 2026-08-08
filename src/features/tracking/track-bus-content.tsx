"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { LiveMap } from "@/features/tracking/live-map";
import { getTrackableTripsForPassenger } from "@/actions/tracking.actions";
import { formatDate } from "@/lib/utils";
import { Bus, Clock, AlertTriangle, RefreshCw, Sparkles } from "lucide-react";

type TrackItem = Awaited<ReturnType<typeof getTrackableTripsForPassenger>>[number];

export function TrackBusContent() {
  const [items, setItems] = useState<TrackItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const load = useCallback(() => {
    startTransition(async () => {
      const data = await getTrackableTripsForPassenger();
      setItems(data);
      setSelectedId((prev) => prev ?? data[0]?.trip.id ?? null);
    });
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
  }, [load]);

  const selected = items.find((i) => i.trip.id === selectedId) ?? items[0];

  if (!pending && items.length === 0) {
    return (
      <EmptyState
        title="No active trips to track"
        description="Book a ticket first, then track your bus here with live GPS and delay predictions."
      />
    );
  }

  const trip = selected?.trip;
  const risk = trip?.prediction.riskLevel;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Track your bus</h1>
          <p className="text-muted-foreground text-[15px]">Live map location and delay estimate</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={pending}>
          <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="space-y-3">
          {items.map((item) => (
            <button
              key={item.bookingId}
              type="button"
              onClick={() => setSelectedId(item.trip.id)}
              className={`w-full rounded-xl border p-4 text-left transition-all ${
                selected?.bookingId === item.bookingId
                  ? "border-primary bg-primary/5 shadow-soft"
                  : "hover:border-primary/40"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-sm">
                  {item.trip.route.source} → {item.trip.route.destination}
                </p>
                <Badge variant="outline">{item.trip.status}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Seat {item.seatNumber} · Bus {item.trip.busNumber}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDate(item.trip.tripDate)} · {item.trip.departureTime}
              </p>
            </button>
          ))}
        </div>

        {trip && (
          <div className="space-y-4">
            <LiveMap
              height={380}
              bus={
                trip.currentLat != null && trip.currentLng != null
                  ? { lat: trip.currentLat, lng: trip.currentLng, label: trip.busNumber }
                  : trip.route.sourceLat != null && trip.route.sourceLng != null
                    ? { lat: trip.route.sourceLat, lng: trip.route.sourceLng, label: "Awaiting GPS" }
                    : { lat: 23.8103, lng: 90.4125, label: "Awaiting GPS" }
              }
              source={
                trip.route.sourceLat != null && trip.route.sourceLng != null
                  ? { lat: trip.route.sourceLat, lng: trip.route.sourceLng, label: trip.route.source }
                  : null
              }
              destination={
                trip.route.destLat != null && trip.route.destLng != null
                  ? { lat: trip.route.destLat, lng: trip.route.destLng, label: trip.route.destination }
                  : null
              }
              trail={trip.trail.map((t) => ({ lat: t.lat, lng: t.lng }))}
            />

            <div className="grid gap-3 sm:grid-cols-3">
              <Card>
                <CardContent className="p-4 space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Bus className="h-3.5 w-3.5" /> Bus / Driver
                  </p>
                  <p className="font-semibold">{trip.busNumber}</p>
                  <p className="text-sm text-muted-foreground">{trip.driverName}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> Predicted ETA
                  </p>
                  <p className="font-semibold">
                    {new Date(trip.prediction.eta).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {Math.round(trip.prediction.confidence * 100)}% confidence
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" /> Delay estimate
                  </p>
                  <p className="font-semibold flex items-center gap-2">
                    {trip.predictedDelayMinutes ?? trip.prediction.predictedDelayMinutes} min
                    <Badge
                      className={
                        risk === "high"
                          ? "bg-destructive"
                          : risk === "medium"
                            ? "bg-warning text-black"
                            : "bg-success"
                      }
                    >
                      {risk}
                    </Badge>
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {trip.delayReason ?? trip.prediction.reason}
                  </p>
                </CardContent>
              </Card>
            </div>

            {trip.prediction.factors?.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm font-medium flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    Delay factors
                  </p>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    {trip.prediction.factors.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
