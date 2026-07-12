"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import type { ChartDataPoint } from "@/types";

const COLORS = ["#006A4E", "#E63946", "#FFB703", "#1D3557", "#457B9D", "#2A9D8F"];

export function AnalyticsContent({ revenue, routes }: { revenue: ChartDataPoint[]; routes: ChartDataPoint[] }) {
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Analytics</h1><p className="text-muted-foreground">Interactive charts and insights</p></div>
      <div className="grid md:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle>Revenue Trends</CardTitle></CardHeader>
          <CardContent><ResponsiveContainer width="100%" height={300}><BarChart data={revenue}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#006A4E" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></CardContent>
        </Card>
        <Card><CardHeader><CardTitle>Route Popularity</CardTitle></CardHeader>
          <CardContent><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={routes} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>{routes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></CardContent>
        </Card>
      </div>
    </div>
  );
}
