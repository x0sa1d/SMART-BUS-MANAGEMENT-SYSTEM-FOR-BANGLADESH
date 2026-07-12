import { EmptyState } from "@/components/shared/empty-state";

export default function DriverTripsPage() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">My Trips</h1></div>
      <EmptyState title="Trip list" description="Your assigned trips appear on the dashboard." />
    </div>
  );
}
