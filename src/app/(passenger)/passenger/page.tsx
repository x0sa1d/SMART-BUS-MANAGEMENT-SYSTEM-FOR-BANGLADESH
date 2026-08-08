import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Ticket, MapPin, PackageSearch } from "lucide-react";

const cards = [
  { href: "/passenger/search", icon: Search, title: "Search buses", cta: "Search now", variant: "gradient" as const, desc: "Find a trip and pick your seats." },
  { href: "/passenger/bookings", icon: Ticket, title: "My bookings", cta: "View tickets", variant: "outline" as const, desc: "Open QR tickets and trip history." },
  { href: "/passenger/track", icon: MapPin, title: "Track bus", cta: "Track now", variant: "outline" as const, desc: "See live location and delay tips." },
  { href: "/passenger/lost-found", icon: PackageSearch, title: "Lost & found", cta: "Open", variant: "outline" as const, desc: "Report or claim left items." },
];

export default function PassengerDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Passenger home</h1>
        <p className="text-muted-foreground text-[15px]">Book a seat, track your bus, or report a lost item.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {cards.map((c) => (
          <Card key={c.title} className="border-[#e8eaef]">
            <CardContent className="p-5 space-y-3">
              <c.icon className="h-7 w-7 text-primary" />
              <div>
                <h3 className="font-semibold">{c.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{c.desc}</p>
              </div>
              <Button variant={c.variant} asChild>
                <Link href={c.href}>{c.cta}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
