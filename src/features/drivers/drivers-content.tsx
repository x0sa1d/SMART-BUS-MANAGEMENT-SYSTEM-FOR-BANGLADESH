"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { createDriver, deleteDriver } from "@/actions/driver.actions";
import { usePermissions } from "@/components/providers/permissions-provider";
import { toast } from "sonner";
import { Plus, Trash2, UserCog } from "lucide-react";

type DriverItem = {
  id: string; fullName: string; licenseNumber: string; phone: string;
  email: string; experience: number; isActive: boolean;
  _count: { buses: number; trips: number };
};

export function DriversContent({ drivers }: { drivers: DriverItem[] }) {
  const router = useRouter();
  const { canWrite } = usePermissions();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleCreate = (formData: FormData) => {
    startTransition(async () => {
      const result = await createDriver(formData);
      if (result.success) { toast.success("Driver added"); setOpen(false); router.refresh(); }
      else toast.error(result.error);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Driver Management</h1><p className="text-muted-foreground">Manage drivers and assignments</p></div>
        {canWrite && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="gradient"><Plus className="h-4 w-4" /> Add Driver</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Driver</DialogTitle></DialogHeader>
            <form action={handleCreate} className="space-y-4">
              <div className="space-y-2"><Label>Full Name</Label><Input name="fullName" required /></div>
              <div className="space-y-2"><Label>License Number</Label><Input name="licenseNumber" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Phone</Label><Input name="phone" required /></div>
                <div className="space-y-2"><Label>Email</Label><Input name="email" type="email" required /></div>
              </div>
              <div className="space-y-2"><Label>Experience (years)</Label><Input name="experience" type="number" defaultValue="0" /></div>
              <input type="hidden" name="isActive" value="true" />
              <Button type="submit" variant="gradient" className="w-full" disabled={pending}>Add Driver</Button>
            </form>
          </DialogContent>
        </Dialog>
        )}
      </div>
      {drivers.length === 0 ? <EmptyState title="No drivers yet" description="Add your first driver." /> : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {drivers.map((driver) => (
            <Card key={driver.id}>
              <CardContent className="p-6 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2"><UserCog className="h-5 w-5 text-primary" /></div>
                    <div><p className="font-semibold">{driver.fullName}</p><p className="text-xs text-muted-foreground">{driver.licenseNumber}</p></div>
                  </div>
                  <Badge variant={driver.isActive ? "default" : "secondary"}>{driver.isActive ? "Active" : "Inactive"}</Badge>
                </div>
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Phone:</span> {driver.phone}</p>
                  <p><span className="text-muted-foreground">Experience:</span> {driver.experience} years</p>
                  <p><span className="text-muted-foreground">Buses:</span> {driver._count.buses} | Trips: {driver._count.trips}</p>
                </div>
                {canWrite && (
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => startTransition(async () => { await deleteDriver(driver.id); router.refresh(); })}>
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
