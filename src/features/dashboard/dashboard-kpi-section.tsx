import { getDashboardStats } from "@/services/dashboard.service";
import { KpiCard } from "@/components/shared/kpi-card";
import { Badge } from "@/components/ui/badge";
import {
  Bus, Route, Calendar, Users, UserCog, CreditCard, Ticket, TrendingUp,
  Building2, Wrench, MapPin, Percent, BarChart3,
} from "lucide-react";

export async function DashboardKpiSection() {
  const stats = await getDashboardStats();

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-destructive/5 p-6">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-destructive/10 blur-2xl" />
        <div className="relative">
          <Badge className="mb-3 bg-primary/15 text-primary hover:bg-primary/15 border-primary/20">
            Bangladesh Transport Network
          </Badge>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Operations Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Live overview — {stats.totalCompanies.toLocaleString()} operators · {stats.totalRoutes} routes · {stats.totalTerminals} terminals · {stats.totalUpazilas} upazilas
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <KpiCard title="Bus Companies" value={stats.totalCompanies} icon={Building2} description={`${stats.activeCompanies} active`} accent="green" />
        <KpiCard title="Active Buses" value={stats.activeBuses} icon={Bus} description={`${stats.totalBuses} total fleet`} accent="emerald" />
        <KpiCard title="Total Routes" value={stats.totalRoutes} icon={Route} description={`${stats.activeRoutes} active`} accent="teal" />
        <KpiCard title="Trips Today" value={stats.tripsToday} icon={Calendar} description={`${stats.activeTrips} in progress`} accent="blue" />
        <KpiCard title="Drivers" value={stats.totalDrivers} icon={UserCog} accent="navy" />
        <KpiCard title="Passengers" value={stats.totalPassengers} icon={Users} trend={stats.passengerGrowth} accent="violet" />
        <KpiCard title="Total Bookings" value={stats.totalBookings} icon={Ticket} description={`${stats.todayBookings} today`} accent="amber" />
        <KpiCard title="Daily Revenue" value={stats.dailyRevenue} icon={CreditCard} format="currency" accent="green" />
        <KpiCard title="Monthly Revenue" value={stats.monthlyRevenue} icon={TrendingUp} format="currency" accent="rose" />
        <KpiCard title="Active Schedules" value={stats.activeSchedules} icon={Calendar} accent="cyan" />
        <KpiCard title="Pending Maintenance" value={stats.pendingMaintenance} icon={Wrench} accent="orange" />
        <KpiCard title="Occupancy Rate" value={stats.occupancyRate} icon={Percent} format="percent" accent="lime" />
        <KpiCard title="Bus Terminals" value={stats.totalTerminals} icon={MapPin} accent="sky" />
        <KpiCard title="Total Revenue" value={stats.totalRevenue} icon={BarChart3} format="currency" accent="green" />
      </div>
    </>
  );
}
