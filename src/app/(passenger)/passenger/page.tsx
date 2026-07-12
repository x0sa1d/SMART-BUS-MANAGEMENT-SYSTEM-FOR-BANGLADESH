import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Ticket, MapPin } from "lucide-react";

export default function PassengerDashboardPage() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Passenger Dashboard</h1><p className="text-muted-foreground">Book tickets and track your trips</p></div>
      <div className="grid md:grid-cols-3 gap-4">
        <Card><CardContent className="p-6 text-center space-y-3">
          <Search className="h-8 w-8 text-primary mx-auto" />
          <h3 className="font-semibold">Search Buses</h3>
          <Button variant="gradient" asChild><Link href="/passenger/search">Search Now</Link></Button>
        </CardContent></Card>
        <Card><CardContent className="p-6 text-center space-y-3">
          <Ticket className="h-8 w-8 text-primary mx-auto" />
          <h3 className="font-semibold">My Bookings</h3>
          <Button variant="outline" asChild><Link href="/passenger/bookings">View Bookings</Link></Button>
        </CardContent></Card>
        <Card><CardContent className="p-6 text-center space-y-3">
          <MapPin className="h-8 w-8 text-primary mx-auto" />
          <h3 className="font-semibold">Track Bus</h3>
          <Button variant="outline" asChild><Link href="/passenger/track">Track Now</Link></Button>
        </CardContent></Card>
      </div>
    </div>
  );
}
