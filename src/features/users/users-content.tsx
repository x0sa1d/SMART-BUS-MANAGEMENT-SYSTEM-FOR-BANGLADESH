"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createUser, removeUser, updateUserRole } from "@/actions/user.actions";
import { usePermissions } from "@/components/providers/permissions-provider";
import { ROLE_LABELS, isRemovableUserRole } from "@/lib/permissions";
import type { Role } from "@prisma/client";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { Plus, Trash2, Users, Pencil } from "lucide-react";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  companyId: string | null;
  company: { name: string } | null;
  emailVerified: boolean;
  createdAt: string;
};

type CompanyOption = { id: string; name: string };

const roleVariant = (role: Role) => {
  if (role === "SUPER_ADMIN") return "default";
  if (role === "MANAGER") return "secondary";
  return "outline";
};

export function UsersContent({
  users,
  companies = [],
}: {
  users: UserRow[];
  companies?: CompanyOption[];
}) {
  const router = useRouter();
  const { canManageUsers, canRemoveUser, isSuperAdmin } = usePermissions();
  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [role, setRole] = useState<string>("PASSENGER");
  const [companyId, setCompanyId] = useState("");
  const [pending, startTransition] = useTransition();

  const handleCreate = (formData: FormData) => {
    formData.set("role", role);
    if (role === "MANAGER" && companyId) formData.set("companyId", companyId);
    startTransition(async () => {
      const result = await createUser(formData);
      if (result.success) {
        toast.success("User created");
        setOpen(false);
        router.refresh();
      } else toast.error(result.error);
    });
  };

  const handleRemove = (user: UserRow) => {
    if (!confirm(`Remove user "${user.name}"?`)) return;
    startTransition(async () => {
      const result = await removeUser(user.id);
      if (result.success) {
        toast.success("User removed");
        router.refresh();
      } else toast.error(result.error);
    });
  };

  const handleEditRole = (formData: FormData) => {
    if (!editUser) return;
    formData.set("userId", editUser.id);
    formData.set("role", role);
    if (role === "MANAGER" && companyId) formData.set("companyId", companyId);
    startTransition(async () => {
      const result = await updateUserRole(formData);
      if (result.success) {
        toast.success("User role updated");
        setEditUser(null);
        router.refresh();
      } else toast.error(result.error);
    });
  };

  const openEdit = (user: UserRow) => {
    setEditUser(user);
    setRole(user.role === "SUPER_ADMIN" ? "PASSENGER" : user.role);
    setCompanyId(user.companyId ?? "");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground">
            Manage passengers, drivers, and company representatives. Email and passwords are set at creation only.
          </p>
        </div>
        {canManageUsers && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient"><Plus className="h-4 w-4" /> Add User</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create User Account</DialogTitle></DialogHeader>
              <form action={handleCreate} className="space-y-4">
                <div className="space-y-2"><Label>Name</Label><Input name="name" required /></div>
                <div className="space-y-2"><Label>Email</Label><Input name="email" type="email" required /></div>
                <div className="space-y-2"><Label>Password</Label><Input name="password" type="password" required minLength={8} /></div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PASSENGER">Passenger</SelectItem>
                      <SelectItem value="DRIVER">Driver</SelectItem>
                      <SelectItem value="MANAGER">Company Representative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {role === "MANAGER" && (
                  <div className="space-y-2">
                    <Label>Company</Label>
                    <Select value={companyId} onValueChange={setCompanyId}>
                      <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                      <SelectContent>
                        {companies.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button type="submit" variant="gradient" className="w-full" disabled={pending}>Create User</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {(["SUPER_ADMIN", "MANAGER", "PASSENGER", "DRIVER"] as Role[]).map((r) => (
          <Card key={r} className="card-elevated">
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{users.filter((u) => u.role === r).length}</p>
                <p className="text-xs text-muted-foreground">{ROLE_LABELS[r]}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-3">
        {users.map((user) => {
          const removable = canRemoveUser && isRemovableUserRole(user.role, user.companyId);
          const isPlatformAdmin = user.role === "MANAGER" && !user.companyId;
          return (
            <Card key={user.id} className="card-elevated">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold">{user.name}</p>
                    <Badge variant={roleVariant(user.role)}>
                      {isPlatformAdmin ? "Admin" : user.role === "MANAGER" ? "Company Rep" : ROLE_LABELS[user.role]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  {user.company && <p className="text-xs text-muted-foreground">{user.company.name}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-xs text-muted-foreground">Joined {formatDate(user.createdAt)}</p>
                  {canManageUsers && isRemovableUserRole(user.role, user.companyId) && (
                    <Button variant="outline" size="sm" disabled={pending} onClick={() => openEdit(user)}>
                      <Pencil className="h-4 w-4" /> Edit Role
                    </Button>
                  )}
                  {removable && !isPlatformAdmin && (
                    <Button variant="ghost" size="sm" className="text-destructive" disabled={pending} onClick={() => handleRemove(user)}>
                      <Trash2 className="h-4 w-4" /> Remove
                    </Button>
                  )}
                  {isPlatformAdmin && !isSuperAdmin && (
                    <span className="text-xs text-muted-foreground">Admin — Super Admin only removal</span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User Role</DialogTitle></DialogHeader>
          {editUser && (
            <form action={handleEditRole} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Updating role for <strong>{editUser.name}</strong>. Email and password cannot be changed here.
              </p>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PASSENGER">Passenger</SelectItem>
                    <SelectItem value="DRIVER">Driver</SelectItem>
                    <SelectItem value="MANAGER">Company Representative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {role === "MANAGER" && (
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Select value={companyId} onValueChange={setCompanyId}>
                    <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                    <SelectContent>
                      {companies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button type="submit" variant="gradient" className="w-full" disabled={pending}>Save Role</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
