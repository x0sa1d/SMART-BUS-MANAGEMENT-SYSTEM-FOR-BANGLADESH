"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createAdmin, removeAdmin } from "@/actions/user.actions";
import { usePermissions } from "@/components/providers/permissions-provider";
import { toast } from "sonner";
import { Plus, ShieldCheck, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

type AdminRow = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
};

export function AdminsContent({ admins }: { admins: AdminRow[] }) {
  const router = useRouter();
  const { canManageAdmins, canRemoveAdmin } = usePermissions();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleCreate = (formData: FormData) => {
    startTransition(async () => {
      const result = await createAdmin(formData);
      if (result.success) {
        toast.success("Admin account created");
        setOpen(false);
        router.refresh();
      } else toast.error(result.error);
    });
  };

  const handleRemove = (id: string, name: string) => {
    if (!confirm(`Remove admin "${name}"? They will lose dashboard access.`)) return;
    startTransition(async () => {
      const result = await removeAdmin(id);
      if (result.success) {
        toast.success("Admin removed");
        router.refresh();
      } else toast.error(result.error);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Admins</h1>
          <p className="text-muted-foreground">
            Platform administrators with full system access. Only Super Admin can remove admins.
          </p>
        </div>
        {canManageAdmins && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient"><Plus className="h-4 w-4" /> Add Admin</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Admin Account</DialogTitle></DialogHeader>
              <form action={handleCreate} className="space-y-4">
                <div className="space-y-2"><Label>Name</Label><Input name="name" required /></div>
                <div className="space-y-2"><Label>Email</Label><Input name="email" type="email" required /></div>
                <div className="space-y-2"><Label>Password</Label><Input name="password" type="password" required minLength={8} /></div>
                <Button type="submit" variant="gradient" className="w-full" disabled={pending}>Create Admin</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-3">
        {admins.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No admin accounts yet.</p>
        ) : (
          admins.map((admin) => (
            <Card key={admin.id} className="card-elevated">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl gradient-primary text-white flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{admin.name}</p>
                      <Badge>Admin</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{admin.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">Added {formatDate(admin.createdAt)}</p>
                  </div>
                </div>
                {canRemoveAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={pending}
                    onClick={() => handleRemove(admin.id, admin.name)}
                  >
                    <Trash2 className="h-4 w-4" /> Remove
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
