import { getDashboardStats, getRevenueTrend, getRoutePopularity } from "@/services/dashboard.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default async function ReportsPage() {
  const [stats, revenue, routes] = await Promise.all([getDashboardStats(), getRevenueTrend(), getRoutePopularity()]);
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Reports</h1><p className="text-muted-foreground">Business performance reports</p></div>
      <div className="grid md:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle>Revenue Summary</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Total Revenue: <strong>{formatCurrency(stats.totalRevenue)}</strong></p>
            <p>Monthly Revenue: <strong>{formatCurrency(stats.monthlyRevenue)}</strong></p>
            <p>Today&apos;s Bookings: <strong>{stats.todayBookings}</strong></p>
          </CardContent>
        </Card>
        <Card><CardHeader><CardTitle>Route Performance</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {routes.map((r) => (<p key={r.name}>{r.name}: <strong>{r.value} bookings</strong></p>))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
