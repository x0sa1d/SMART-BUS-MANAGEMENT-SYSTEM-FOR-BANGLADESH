"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { setRolePolicy } from "@/actions/policy.actions";
import { ROLE_LABELS } from "@/lib/permissions";
import type { Role } from "@prisma/client";
import { toast } from "sonner";

type Permission = { id: string; name: string; description: string | null; module: string };

const POLICY_ROLES: Role[] = ["SUPER_ADMIN", "MANAGER", "DRIVER", "PASSENGER"];

export function PoliciesContent({
  permissions,
  matrix,
}: {
  permissions: Permission[];
  matrix: Record<Role, string[]>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const toggle = (role: Role, permissionId: string, enabled: boolean) => {
    startTransition(async () => {
      const result = await setRolePolicy(role, permissionId, enabled);
      if (result.success) {
        toast.success("Policy updated");
        router.refresh();
      } else toast.error(result.error);
    });
  };

  const modules = [...new Set(permissions.map((p) => p.module))];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Policies</h1>
        <p className="text-muted-foreground">
          Super Admins and Admins can configure role permissions. Personal details (email, password) are never editable by administrators.
        </p>
      </div>

      {modules.map((module) => (
        <Card key={module}>
          <CardHeader>
            <CardTitle className="text-lg capitalize">{module}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {permissions.filter((p) => p.module === module).map((perm) => (
              <div key={perm.id} className="border rounded-lg p-4 space-y-3">
                <div>
                  <p className="font-medium">{perm.name.replace(/_/g, " ")}</p>
                  {perm.description && <p className="text-sm text-muted-foreground">{perm.description}</p>}
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {POLICY_ROLES.map((role) => {
                    const enabled = matrix[role]?.includes(perm.id) ?? false;
                    return (
                      <label key={role} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                        <span className="flex items-center gap-2">
                          <Badge variant="outline">{ROLE_LABELS[role]}</Badge>
                        </span>
                        <Switch
                          checked={enabled}
                          disabled={pending}
                          onCheckedChange={(v) => toggle(role, perm.id, v)}
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
