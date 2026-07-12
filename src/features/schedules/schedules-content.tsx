"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { usePermissions } from "@/components/providers/permissions-provider";
import {
  createScheduleManaged,
  updateSchedule,
  deleteSchedule,
  createScheduledDeparture,
} from "@/actions/schedule.actions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { Calendar, Clock, Plus, Trash2, CalendarPlus, Pencil } from "lucide-react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type ScheduleItem = {
  id: string;
  departureTime: string;
  arrivalTime: string;
  fare: number;
  isActive: boolean;
  daysOfWeek: string[];
  route: { id: string; name: string; source: string; destination: string };
  bus: { id: string; busNumber: string; company?: { name: string } | null };
  driver: { id: string; fullName: string };
  trips: { id: string; tripDate: string }[];
};

type FormOptions = {
  routes: { id: string; name: string }[];
  buses: { id: string; busNumber: string }[];
  drivers: { id: string; fullName: string }[];
};

export function SchedulesContent({
  schedules,
  formOptions,
}: {
  schedules: ScheduleItem[];
  formOptions: FormOptions;
}) {
  const router = useRouter();
  const { canManageAllSchedules, canManageCompanySchedules } = usePermissions();
  const canManage = canManageAllSchedules || canManageCompanySchedules;
  const [createOpen, setCreateOpen] = useState(false);
  const [editSchedule, setEditSchedule] = useState<ScheduleItem | null>(null);
  const [tripOpen, setTripOpen] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([...DAYS]);
  const [editDays, setEditDays] = useState<string[]>([...DAYS]);
  const [routeId, setRouteId] = useState("");
  const [busId, setBusId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [editRouteId, setEditRouteId] = useState("");
  const [editBusId, setEditBusId] = useState("");
  const [editDriverId, setEditDriverId] = useState("");
  const [pending, startTransition] = useTransition();

  const handleCreate = (formData: FormData) => {
    if (!routeId || !busId || !driverId) {
      toast.error("Select route, bus, and driver");
      return;
    }
    formData.set("routeId", routeId);
    formData.set("busId", busId);
    formData.set("driverId", driverId);
    selectedDays.forEach((d) => formData.append("daysOfWeek", d));
    startTransition(async () => {
      const result = await createScheduleManaged(formData);
      if (result.success) {
        toast.success("Schedule created");
        setCreateOpen(false);
        router.refresh();
      } else toast.error(result.error);
    });
  };

  const handleDeparture = (scheduleId: string, formData: FormData) => {
    formData.set("scheduleId", scheduleId);
    startTransition(async () => {
      const result = await createScheduledDeparture(formData);
      if (result.success) {
        toast.success("Departure scheduled");
        setTripOpen(null);
        router.refresh();
      } else toast.error(result.error);
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this schedule?")) return;
    startTransition(async () => {
      const result = await deleteSchedule(id);
      if (result.success) {
        toast.success("Schedule removed");
        router.refresh();
      } else toast.error(result.error);
    });
  };

  const openEdit = (schedule: ScheduleItem) => {
    setEditSchedule(schedule);
    setEditRouteId(schedule.route.id);
    setEditBusId(schedule.bus.id);
    setEditDriverId(schedule.driver.id);
    setEditDays(schedule.daysOfWeek.length ? schedule.daysOfWeek : [...DAYS]);
  };

  const handleUpdate = (formData: FormData) => {
    if (!editSchedule) return;
    if (!editRouteId || !editBusId || !editDriverId) {
      toast.error("Select route, bus, and driver");
      return;
    }
    formData.set("routeId", editRouteId);
    formData.set("busId", editBusId);
    formData.set("driverId", editDriverId);
    formData.set("isActive", editSchedule.isActive ? "true" : "false");
    editDays.forEach((d) => formData.append("daysOfWeek", d));
    startTransition(async () => {
      const result = await updateSchedule(editSchedule.id, formData);
      if (result.success) {
        toast.success("Schedule updated");
        setEditSchedule(null);
        router.refresh();
      } else toast.error(result.error);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Schedules</h1>
          <p className="text-muted-foreground">
            {canManageAllSchedules
              ? "Manage all bus schedules, departure times, and trip dates"
              : "Manage schedules for your company buses only"}
          </p>
        </div>
        {canManage && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient"><Plus className="h-4 w-4" /> Add Schedule</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>New Schedule</DialogTitle></DialogHeader>
              <form action={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Route</Label>
                  <Select value={routeId} onValueChange={setRouteId}>
                    <SelectTrigger><SelectValue placeholder="Select route" /></SelectTrigger>
                    <SelectContent>
                      {formOptions.routes.map((r) => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Bus</Label>
                    <Select value={busId} onValueChange={setBusId}>
                      <SelectTrigger><SelectValue placeholder="Bus" /></SelectTrigger>
                      <SelectContent>
                        {formOptions.buses.map((b) => (
                          <SelectItem key={b.id} value={b.id}>{b.busNumber}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Driver</Label>
                    <Select value={driverId} onValueChange={setDriverId}>
                      <SelectTrigger><SelectValue placeholder="Driver" /></SelectTrigger>
                      <SelectContent>
                        {formOptions.drivers.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.fullName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Departure</Label><Input name="departureTime" type="time" required defaultValue="06:00" /></div>
                  <div className="space-y-2"><Label>Arrival</Label><Input name="arrivalTime" type="time" required defaultValue="12:00" /></div>
                </div>
                <div className="space-y-2"><Label>Fare (BDT)</Label><Input name="fare" type="number" min={0} required defaultValue={500} /></div>
                <div className="space-y-2">
                  <Label>Operating Days</Label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map((day) => (
                      <label key={day} className="flex items-center gap-1.5 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedDays.includes(day)}
                          onChange={(e) =>
                            setSelectedDays((prev) =>
                              e.target.checked ? [...prev, day] : prev.filter((d) => d !== day)
                            )
                          }
                          className="rounded border-input"
                        />
                        {day}
                      </label>
                    ))}
                  </div>
                </div>
                <Button type="submit" variant="gradient" className="w-full" disabled={pending}>Create Schedule</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {schedules.length === 0 ? (
        <EmptyState title="No schedules" description="Create a schedule to assign buses to routes." />
      ) : (
        <div className="grid gap-4">
          {schedules.map((s) => (
            <Card key={s.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="text-lg">{s.route.name}</CardTitle>
                  <Badge variant={s.isActive ? "default" : "secondary"}>{s.isActive ? "Active" : "Inactive"}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-4 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Route:</span> {s.route.source} → {s.route.destination}</div>
                  <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> {s.departureTime} – {s.arrivalTime}</div>
                  <div><span className="text-muted-foreground">Bus:</span> {s.bus.busNumber}{s.bus.company ? ` (${s.bus.company.name})` : ""}</div>
                  <div><span className="text-muted-foreground">Fare:</span> {formatCurrency(Number(s.fare))}</div>
                </div>
                {s.trips.length > 0 && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Upcoming: {s.trips.map((t) => formatDate(t.tripDate)).join(", ")}
                  </p>
                )}
                {canManage && (
                  <div className="flex gap-2 pt-2 border-t">
                    <Button variant="outline" size="sm" disabled={pending} onClick={() => openEdit(s)}>
                      <Pencil className="h-4 w-4" /> Edit
                    </Button>
                    <Dialog open={tripOpen === s.id} onOpenChange={(o) => setTripOpen(o ? s.id : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm"><CalendarPlus className="h-4 w-4" /> Set Departure Date</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Schedule Departure</DialogTitle></DialogHeader>
                        <form action={(fd) => handleDeparture(s.id, fd)} className="space-y-4">
                          <div className="space-y-2">
                            <Label>Departure Date</Label>
                            <Input name="tripDate" type="date" required min={new Date().toISOString().split("T")[0]} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Departure Time</Label><Input name="departureTime" type="time" defaultValue={s.departureTime} /></div>
                            <div className="space-y-2"><Label>Arrival Time</Label><Input name="arrivalTime" type="time" defaultValue={s.arrivalTime} /></div>
                          </div>
                          <Button type="submit" variant="gradient" className="w-full" disabled={pending}>Create Trip</Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                    <Button variant="ghost" size="sm" className="text-destructive" disabled={pending} onClick={() => handleDelete(s.id)}>
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editSchedule} onOpenChange={(o) => !o && setEditSchedule(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Schedule</DialogTitle></DialogHeader>
          {editSchedule && (
            <form action={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label>Route</Label>
                <Select value={editRouteId} onValueChange={setEditRouteId}>
                  <SelectTrigger><SelectValue placeholder="Select route" /></SelectTrigger>
                  <SelectContent>
                    {formOptions.routes.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bus</Label>
                  <Select value={editBusId} onValueChange={setEditBusId}>
                    <SelectTrigger><SelectValue placeholder="Bus" /></SelectTrigger>
                    <SelectContent>
                      {formOptions.buses.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.busNumber}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Driver</Label>
                  <Select value={editDriverId} onValueChange={setEditDriverId}>
                    <SelectTrigger><SelectValue placeholder="Driver" /></SelectTrigger>
                    <SelectContent>
                      {formOptions.drivers.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.fullName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Departure</Label><Input name="departureTime" type="time" required defaultValue={editSchedule.departureTime} /></div>
                <div className="space-y-2"><Label>Arrival</Label><Input name="arrivalTime" type="time" required defaultValue={editSchedule.arrivalTime} /></div>
              </div>
              <div className="space-y-2"><Label>Fare (BDT)</Label><Input name="fare" type="number" min={0} required defaultValue={Number(editSchedule.fare)} /></div>
              <div className="space-y-2">
                <Label>Operating Days</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day) => (
                    <label key={day} className="flex items-center gap-1.5 text-sm">
                      <input
                        type="checkbox"
                        checked={editDays.includes(day)}
                        onChange={(e) =>
                          setEditDays((prev) =>
                            e.target.checked ? [...prev, day] : prev.filter((d) => d !== day)
                          )
                        }
                        className="rounded border-input"
                      />
                      {day}
                    </label>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editSchedule.isActive}
                  onChange={(e) => setEditSchedule({ ...editSchedule, isActive: e.target.checked })}
                  className="rounded border-input"
                />
                Active schedule
              </label>
              <Button type="submit" variant="gradient" className="w-full" disabled={pending}>Save Changes</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
