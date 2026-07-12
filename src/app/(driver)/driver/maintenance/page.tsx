import { EmptyState } from "@/components/shared/empty-state";

export default function DriverMaintenancePage() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Maintenance Reports</h1></div>
      <EmptyState title="Submit maintenance reports" description="Report vehicle issues to the admin team." />
    </div>
  );
}
