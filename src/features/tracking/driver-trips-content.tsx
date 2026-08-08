"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { getDriverActiveTrips, updateTripLocation } from "@/actions/tracking.actions";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { MapPin, Navigation, Loader2, Radio } from "lucide-react";

type Trip = Awaited<ReturnType<typeof getDriverActiveTrips>>[number];

export function DriverTripsContent() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const load = useCallback(() => {
    startTransition(async () => {
      setTrips(await getDriverActiveTrips());
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!sharingId) return;
    let watchId: number | null = null;

    const push = (lat: number, lng: number, speed?: number) => {
      updateTripLocation({
        tripId: sharingId,
        latitude: lat,
        longitude: lng,
        speed,
      }).then((res) => {
        if (!res.success) toast.error(res.error || "Failed to push location");
      });
    };

    if (!navigator.geolocation) {
      toast.error("Geolocation not supported on this device");
      setSharingId(null);
      return;
    }

    toast.success("Live GPS sharing started");
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        push(pos.coords.latitude, pos.coords.longitude, pos.coords.speed ?? undefined);
      },
      () => toast.error("Unable to read GPS. Check location permission"),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    // Demo fallback ping near Dhaka if GPS never fires (desktop)
    const fallback = setTimeout(() => {
      push(23.8103 + Math.random() * 0.05, 90.4125 + Math.random() * 0.05, 40);
    }, 4000);

    return () => {
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
      clearTimeout(fallback);
    };
  }, [sharingId]);

  if (!pending && trips.length === 0) {
    return <EmptyState title="No active trips" description="Assigned trips will appear here for GPS sharing." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Trips</h1>
        <p className="text-muted-foreground">Share live GPS so passengers can track your bus</p>
      </div>

      <div className="space-y-3">
        {trips.map((trip) => {
          const isSharing = sharingId === trip.id;
          return (
            <Card key={trip.id} className={isSharing ? "border-primary shadow-soft" : ""}>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="font-semibold">
                    {trip.source} → {trip.destination}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Bus {trip.busNumber} · {formatDate(trip.tripDate)} · {trip.departureTime}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge>{trip.status}</Badge>
                    {trip.predictedDelayMinutes != null && trip.predictedDelayMinutes > 0 && (
                      <Badge variant="outline">Delay ~{trip.predictedDelayMinutes} min</Badge>
                    )}
                    {trip.currentLat != null && (
                      <Badge variant="outline" className="gap-1">
                        <MapPin className="h-3 w-3" />
                        GPS synced
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {isSharing ? (
                    <Button variant="destructive" onClick={() => setSharingId(null)}>
                      <Radio className="h-4 w-4" /> Stop Sharing
                    </Button>
                  ) : (
                    <Button
                      variant="gradient"
                      disabled={pending}
                      onClick={() => setSharingId(trip.id)}
                    >
                      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                      Share Live GPS
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
