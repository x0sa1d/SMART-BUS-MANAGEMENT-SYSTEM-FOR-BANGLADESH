"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { ChartDataPoint, RoutePerformance } from "@/types";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
const CHART_COLORS = ["#006A4E", "#E63946", "#FFB703", "#1D3557", "#457B9D", "#2A9D8F"];

const chartProps = { isAnimationActive: false };

interface Props {
  revenueTrend: ChartDataPoint[];
  bookingTrend: ChartDataPoint[];
  passengerGrowth: ChartDataPoint[];
  occupancyTrend: ChartDataPoint[];
  routePopularity: ChartDataPoint[];
  routePerformance: RoutePerformance[];
  companyPerformance: ChartDataPoint[];
}

export function DashboardChartsInner({
  revenueTrend,
  bookingTrend,
  passengerGrowth,
  occupancyTrend,
  routePopularity,
  routePerformance,
  companyPerformance,
}: Props) {
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="card-elevated">
          <CardHeader><CardTitle>Revenue Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#006A4E" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#006A4E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(v) => `৳${v}`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Area type="monotone" dataKey="value" stroke="#006A4E" fill="url(#revenueGrad)" strokeWidth={2} {...chartProps} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader><CardTitle>Daily Bookings</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={bookingTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="value" fill="#E63946" radius={[6, 6, 0, 0]} {...chartProps} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader><CardTitle>Passenger Growth</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={passengerGrowth}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#FFB703" strokeWidth={2} dot={{ fill: "#FFB703" }} {...chartProps} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader><CardTitle>Occupancy Rate</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={occupancyTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Line type="monotone" dataKey="value" stroke="#457B9D" strokeWidth={2} dot={false} {...chartProps} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="card-elevated lg:col-span-1">
          <CardHeader><CardTitle>Popular Routes</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              {routePopularity.length > 0 && routePopularity.some((r) => r.value > 0) ? (
                <PieChart>
                  <Pie
                    data={routePopularity}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    isAnimationActive={false}
                    label={({ name, percent }) => `${(name as string).split(" → ")[1] || name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {routePopularity.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No booking data yet — routes will appear after first bookings
                </div>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="card-elevated lg:col-span-1">
          <CardHeader><CardTitle>Top Operators (Fleet)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={companyPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" />
                <YAxis type="category" dataKey="name" className="text-xs" width={70} />
                <Tooltip />
                <Bar dataKey="value" fill="#006A4E" radius={[0, 4, 4, 0]} {...chartProps} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="card-elevated lg:col-span-1">
          <CardHeader><CardTitle>Route Performance</CardTitle></CardHeader>
          <CardContent className="space-y-3 max-h-[260px] overflow-y-auto">
            {routePerformance.map((route) => (
              <div key={route.name} className="flex items-center justify-between gap-2 rounded-lg border p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{route.name}</p>
                  <p className="text-xs text-muted-foreground">{route.bookings} bookings · {route.occupancy}% occupancy</p>
                </div>
                <Badge variant="secondary" className="shrink-0">{formatCurrency(route.revenue)}</Badge>
              </div>
            ))}
            {routePerformance.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No route data yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
