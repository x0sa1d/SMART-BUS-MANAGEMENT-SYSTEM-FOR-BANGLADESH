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
import { createRoute, updateRoute, deleteRoute } from "@/actions/route.actions";
import { usePermissions } from "@/components/providers/permissions-provider";
import { toast } from "sonner";
import { Plus, Trash2, Route as RouteIcon, Pencil } from "lucide-react";

type RouteItem = {
  id: string; name: string; source: string; destination: string;
  distance: number; estimatedDuration: number; isActive: boolean;
  _count: { schedules: number; stops: number };
};

function RouteForm({
  route,
  onSubmit,
  pending,
  submitLabel,
}: {
  route?: RouteItem;
  onSubmit: (fd: FormData) => void;
  pending: boolean;
  submitLabel: string;
}) {
  return (
    <form action={onSubmit} className="space-y-4">
      <div className="space-y-2"><Label>Route Name</Label><Input name="name" required defaultValue={route?.name} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Source</Label><Input name="source" required defaultValue={route?.source} /></div>
        <div className="space-y-2"><Label>Destination</Label><Input name="destination" required defaultValue={route?.destination} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Distance (km)</Label><Input name="distance" type="number" required defaultValue={route?.distance} /></div>
        <div className="space-y-2"><Label>Duration (min)</Label><Input name="estimatedDuration" type="number" required defaultValue={route?.estimatedDuration} /></div>
      </div>
      <input type="hidden" name="isActive" value={route?.isActive !== false ? "true" : "false"} />
      <Button type="submit" variant="gradient" className="w-full" disabled={pending}>{submitLabel}</Button>
    </form>
  );
}

export function RoutesContent({ routes }: { routes: RouteItem[] }) {
  const router = useRouter();
  const { canWrite, isPlatformAdmin, isSuperAdmin } = usePermissions();
  const canManageRoutes = canWrite && (isPlatformAdmin || isSuperAdmin);
  const [createOpen, setCreateOpen] = useState(false);
  const [editRoute, setEditRoute] = useState<RouteItem | null>(null);
  const [pending, startTransition] = useTransition();

  const handleCreate = (formData: FormData) => {
    startTransition(async () => {
      const result = await createRoute(formData);
      if (result.success) { toast.success("Route created"); setCreateOpen(false); router.refresh(); }
      else toast.error(result.error);
    });
  };

  const handleUpdate = (formData: FormData) => {
    if (!editRoute) return;
    startTransition(async () => {
      const result = await updateRoute(editRoute.id, formData);
      if (result.success) { toast.success("Route updated"); setEditRoute(null); router.refresh(); }
      else toast.error(result.error);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Route Management</h1>
          <p className="text-muted-foreground">Add, edit, update, and delete routes and destinations</p>
        </div>
        {canManageRoutes && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild><Button variant="gradient"><Plus className="h-4 w-4" /> Add Route</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Route</DialogTitle></DialogHeader>
              <RouteForm onSubmit={handleCreate} pending={pending} submitLabel="Create Route" />
            </DialogContent>
          </Dialog>
        )}
      </div>
      {routes.length === 0 ? <EmptyState title="No routes yet" description="Create your first route." /> : (
        <div className="grid gap-4 md:grid-cols-2">
          {routes.map((route) => (
            <Card key={route.id}>
              <CardContent className="p-6 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2"><RouteIcon className="h-5 w-5 text-primary" /></div>
                    <div><p className="font-semibold">{route.name}</p><p className="text-sm text-muted-foreground">{route.source} → {route.destination}</p></div>
                  </div>
                  <Badge variant={route.isActive ? "default" : "secondary"}>{route.isActive ? "Active" : "Inactive"}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Distance:</span> {route.distance} km</div>
                  <div><span className="text-muted-foreground">Duration:</span> {route.estimatedDuration} min</div>
                  <div><span className="text-muted-foreground">Schedules:</span> {route._count.schedules}</div>
                </div>
                {canManageRoutes && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditRoute(route)}>
                      <Pencil className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => startTransition(async () => { await deleteRoute(route.id); router.refresh(); })}>
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editRoute} onOpenChange={(o) => !o && setEditRoute(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Route</DialogTitle></DialogHeader>
          {editRoute && <RouteForm route={editRoute} onSubmit={handleUpdate} pending={pending} submitLabel="Save Changes" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
