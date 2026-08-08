"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { MapPin, Bus } from "lucide-react";

export type MapPoint = { lat: number; lng: number; label?: string };

type LiveMapProps = {
  bus?: MapPoint | null;
  source?: MapPoint | null;
  destination?: MapPoint | null;
  trail?: MapPoint[];
  className?: string;
  height?: number;
};

type GoogleMapsNs = {
  maps: {
    Map: new (el: HTMLElement, opts: Record<string, unknown>) => {
      fitBounds: (b: unknown, padding?: number) => void;
    };
    Marker: new (opts: Record<string, unknown>) => unknown;
    Polyline: new (opts: Record<string, unknown>) => unknown;
    LatLngBounds: new () => {
      extend: (p: MapPoint) => void;
      isEmpty: () => boolean;
    };
    SymbolPath: { FORWARD_CLOSED_ARROW: unknown };
  };
};

declare global {
  interface Window {
    google?: GoogleMapsNs;
    __sbmMapsLoading?: Promise<void>;
  }
}

function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps) return Promise.resolve();
  if (window.__sbmMapsLoading) return window.__sbmMapsLoading;

  window.__sbmMapsLoading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(script);
  });

  return window.__sbmMapsLoading;
}

function FallbackMap({ bus, source, destination, height }: LiveMapProps) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-xl border bg-[#e8eef8]"
      style={{ height }}
    >
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(#c5d4f0 1px, transparent 1px), linear-gradient(90deg, #c5d4f0 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      {source && (
        <div className="absolute left-[12%] top-[70%] flex flex-col items-center gap-1">
          <MapPin className="h-6 w-6 text-primary" />
          <span className="rounded bg-white/90 px-2 py-0.5 text-[10px] font-medium shadow">
            {source.label || "Origin"}
          </span>
        </div>
      )}
      {destination && (
        <div className="absolute right-[14%] top-[22%] flex flex-col items-center gap-1">
          <MapPin className="h-6 w-6 text-destructive" />
          <span className="rounded bg-white/90 px-2 py-0.5 text-[10px] font-medium shadow">
            {destination.label || "Destination"}
          </span>
        </div>
      )}
      {bus && (
        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 animate-pulse">
          <div className="rounded-full bg-primary p-2 text-white shadow-lg">
            <Bus className="h-5 w-5" />
          </div>
          <span className="rounded bg-primary px-2 py-0.5 text-[10px] font-semibold text-white shadow">
            {bus.label || "Live bus"}
          </span>
        </div>
      )}
      <div className="absolute bottom-3 left-3 rounded-lg bg-white/90 px-3 py-2 text-xs text-muted-foreground shadow">
        Demo map. Set <code className="text-primary">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> for Google Maps
      </div>
    </div>
  );
}

export function LiveMap({
  bus,
  source,
  destination,
  trail = [],
  className,
  height = 360,
}: LiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"loading" | "google" | "fallback">("loading");
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!apiKey) {
        if (!cancelled) setMode("fallback");
        return;
      }
      try {
        await loadGoogleMaps(apiKey);
        if (cancelled || !containerRef.current || !window.google?.maps) {
          if (!cancelled) setMode("fallback");
          return;
        }

        const g = window.google.maps;
        const center = bus || source || destination || { lat: 23.8103, lng: 90.4125 };
        const map = new g.Map(containerRef.current, {
          center,
          zoom: 7,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });

        const bounds = new g.LatLngBounds();

        if (source) {
          new g.Marker({ position: source, map, title: source.label || "Origin", label: "A" });
          bounds.extend(source);
        }
        if (destination) {
          new g.Marker({
            position: destination,
            map,
            title: destination.label || "Destination",
            label: "B",
          });
          bounds.extend(destination);
        }
        if (bus) {
          new g.Marker({
            position: bus,
            map,
            title: bus.label || "Bus",
            icon: {
              path: g.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 6,
              fillColor: "#1F4FD8",
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: "#ffffff",
            },
          });
          bounds.extend(bus);
        }

        if (trail.length > 1) {
          new g.Polyline({
            path: trail,
            geodesic: true,
            strokeColor: "#1F4FD8",
            strokeOpacity: 0.7,
            strokeWeight: 4,
            map,
          });
          trail.forEach((p) => bounds.extend(p));
        }

        if (!bounds.isEmpty()) map.fitBounds(bounds, 48);
        if (!cancelled) setMode("google");
      } catch {
        if (!cancelled) setMode("fallback");
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [apiKey, bus?.lat, bus?.lng, source?.lat, destination?.lat, trail.length]);

  if (mode === "fallback" || (!apiKey && mode !== "loading")) {
    return (
      <div className={cn(className)}>
        <FallbackMap bus={bus} source={source} destination={destination} height={height} />
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden rounded-xl border", className)} style={{ height }}>
      <div ref={containerRef} className="h-full w-full" />
      {mode === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/60 text-sm text-muted-foreground">
          Loading map…
        </div>
      )}
    </div>
  );
}
