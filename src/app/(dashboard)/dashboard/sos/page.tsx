import { listSosAlertsForAdmin } from "@/actions/tracking.actions";
import { updateSosStatus } from "@/actions/sos.actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { revalidatePath } from "next/cache";

async function setStatus(formData: FormData) {
  "use server";
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "") as "ACKNOWLEDGED" | "RESOLVED" | "FALSE_ALARM";
  if (!id || !status) return;
  await updateSosStatus(id, status);
  revalidatePath("/dashboard/sos");
}

export default async function AdminSosPage() {
  const alerts = await listSosAlertsForAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">SOS Emergency Alerts</h1>
        <p className="text-muted-foreground">Monitor and respond to passenger/driver SOS events</p>
      </div>

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center text-muted-foreground">
              No SOS alerts yet.
            </CardContent>
          </Card>
        ) : (
          alerts.map((alert) => (
            <Card key={alert.id} className={alert.status === "ACTIVE" ? "border-destructive" : ""}>
              <CardContent className="p-5 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {alert.reporterType} SOS
                      {alert.passenger?.fullName ? ` · ${alert.passenger.fullName}` : ""}
                      {alert.driver?.fullName ? ` · ${alert.driver.fullName}` : ""}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDate(alert.createdAt)}
                      {alert.trip?.schedule?.route
                        ? ` · ${alert.trip.schedule.route.source} → ${alert.trip.schedule.route.destination}`
                        : ""}
                      {alert.trip?.bus ? ` · Bus ${alert.trip.bus.busNumber}` : ""}
                    </p>
                    {alert.message && <p className="text-sm mt-2">{alert.message}</p>}
                    {alert.latitude != null && alert.longitude != null && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Location: {alert.latitude.toFixed(5)}, {alert.longitude.toFixed(5)}
                      </p>
                    )}
                  </div>
                  <Badge variant={alert.status === "ACTIVE" ? "destructive" : "outline"}>
                    {alert.status}
                  </Badge>
                </div>
                {alert.status === "ACTIVE" && (
                  <div className="flex flex-wrap gap-2">
                    <form action={setStatus}>
                      <input type="hidden" name="id" value={alert.id} />
                      <input type="hidden" name="status" value="ACKNOWLEDGED" />
                      <Button size="sm" variant="outline" type="submit">
                        Acknowledge
                      </Button>
                    </form>
                    <form action={setStatus}>
                      <input type="hidden" name="id" value={alert.id} />
                      <input type="hidden" name="status" value="RESOLVED" />
                      <Button size="sm" variant="gradient" type="submit">
                        Resolve
                      </Button>
                    </form>
                    <form action={setStatus}>
                      <input type="hidden" name="id" value={alert.id} />
                      <input type="hidden" name="status" value="FALSE_ALARM" />
                      <Button size="sm" variant="ghost" type="submit">
                        False alarm
                      </Button>
                    </form>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
