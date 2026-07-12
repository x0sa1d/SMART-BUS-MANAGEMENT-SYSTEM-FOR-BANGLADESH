import { EmptyState } from "@/components/shared/empty-state";

export default function TrackPage() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Track Bus</h1><p className="text-muted-foreground">Live GPS tracking (requires Google Maps API key)</p></div>
      <EmptyState title="GPS Tracking" description="Configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable live bus tracking on the map." />
    </div>
  );
}
