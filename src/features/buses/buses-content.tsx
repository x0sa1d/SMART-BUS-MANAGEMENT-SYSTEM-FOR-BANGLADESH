"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { createBus, deleteBus } from "@/actions/bus.actions";
import { usePermissions } from "@/components/providers/permissions-provider";
import { toast } from "sonner";
import { Plus, Trash2, Bus as BusIcon } from "lucide-react";
import { formatDate } from "@/lib/utils";

type BusItem = {
  id: string;
  busNumber: string;
  registrationNumber: string;
  busType: string;
  capacity: number;
  isAC: boolean;
  status: string;
  createdAt: Date;
  driver: { fullName: string } | null;
  _count: { seats: number };
};

export function BusesContent({ buses }: { buses: BusItem[] }) {
  const router = useRouter();
  const { canWrite } = usePermissions();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleCreate = (formData: FormData) => {
    startTransition(async () => {
      const result = await createBus(formData);
      if (result.success) { toast.success("Bus created"); setOpen(false); router.refresh(); }
      else toast.error(result.error);
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this bus?")) return;
    startTransition(async () => {
      const result = await deleteBus(id);
      if (result.success) { toast.success("Bus deleted"); router.refresh(); }
      else toast.error(result.error);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bus Management</h1>
          <p className="text-muted-foreground">Manage your fleet of buses</p>
        </div>
        {canWrite && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="gradient"><Plus className="h-4 w-4" /> Add Bus</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Bus</DialogTitle></DialogHeader>
            <form action={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Bus Number</Label><Input name="busNumber" required /></div>
                <div className="space-y-2"><Label>Registration</Label><Input name="registrationNumber" required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bus Type</Label>
                  <Select name="busType" defaultValue="STANDARD">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STANDARD">Standard</SelectItem>
                      <SelectItem value="DELUXE">Deluxe</SelectItem>
                      <SelectItem value="AC">AC</SelectItem>
                      <SelectItem value="NON_AC">Non-AC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Capacity</Label><Input name="capacity" type="number" defaultValue="40" required /></div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select name="status" defaultValue="AVAILABLE">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AVAILABLE">Available</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="RUNNING">Running</SelectItem>
                    <SelectItem value="IN_MAINTENANCE">In Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <input type="hidden" name="isAC" value="false" />
              <Button type="submit" variant="gradient" className="w-full" disabled={pending}>Create Bus</Button>
            </form>
          </DialogContent>
        </Dialog>
        )}
      </div>
      {buses.length === 0 ? (
        <EmptyState title="No buses yet" description="Add your first bus to get started." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {buses.map((bus) => (
            <Card key={bus.id}>
              <CardContent className="p-6 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2"><BusIcon className="h-5 w-5 text-primary" /></div>
                    <div>
                      <p className="font-semibold">{bus.busNumber}</p>
                      <p className="text-xs text-muted-foreground">{bus.registrationNumber}</p>
                    </div>
                  </div>
                  <Badge variant={bus.status === "AVAILABLE" ? "default" : "secondary"}>{bus.status.replace("_", " ")}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Type:</span> {bus.busType}</div>
                  <div><span className="text-muted-foreground">Capacity:</span> {bus.capacity}</div>
                  <div><span className="text-muted-foreground">Seats:</span> {bus._count.seats}</div>
                  <div><span className="text-muted-foreground">Driver:</span> {bus.driver?.fullName || "Unassigned"}</div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-xs text-muted-foreground">Added {formatDate(bus.createdAt)}</span>
                  {canWrite && (
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(bus.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
