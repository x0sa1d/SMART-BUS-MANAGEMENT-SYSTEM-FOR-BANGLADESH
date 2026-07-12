import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDivisions, getLocationStats } from "@/actions/location.actions";
import { MapPin, Route, Building2, Bus } from "lucide-react";

export async function DestinationsView() {
  const [divisions, stats] = await Promise.all([getDivisions(), getLocationStats()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bangladesh Destinations</h1>
        <p className="text-muted-foreground">
          {stats.divisions} divisions · {stats.districts} districts · {stats.routes} routes · tap a destination to view buses
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          <div><p className="text-2xl font-bold">{stats.divisions}</p><p className="text-sm text-muted-foreground">Divisions</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <MapPin className="h-8 w-8 text-primary" />
          <div><p className="text-2xl font-bold">{stats.districts}</p><p className="text-sm text-muted-foreground">Districts</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Route className="h-8 w-8 text-primary" />
          <div><p className="text-2xl font-bold">{stats.routes}</p><p className="text-sm text-muted-foreground">Routes</p></div>
        </CardContent></Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {divisions.map((div) => (
          <Card key={div.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>{div.name}</span>
                <Badge variant="secondary">{div.districts.length} districts</Badge>
              </CardTitle>
              {div.nameBn && <p className="text-sm text-muted-foreground">{div.nameBn}</p>}
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {div.districts.map((d) => (
                  <Link
                    key={d.id}
                    href={`/passenger/search?destination=${encodeURIComponent(d.name)}`}
                  >
                    <Badge variant={d.isHub ? "default" : "outline"} className="text-xs cursor-pointer hover:opacity-80">
                      <Bus className="h-3 w-3 mr-1 inline" />
                      {d.name}{d.isHub ? " ★" : ""}
                    </Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
