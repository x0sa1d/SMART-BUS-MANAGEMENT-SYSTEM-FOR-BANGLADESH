"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateMyProfile } from "@/actions/user.actions";
import { toast } from "sonner";

export function ProfileForm({
  name,
  email,
  roleLabel,
}: {
  name: string;
  email: string;
  roleLabel: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await updateMyProfile(formData);
      if (result.success) {
        toast.success("Profile updated");
        router.refresh();
      } else toast.error(result.error);
    });
  };

  return (
    <Card className="max-w-md">
      <CardHeader><CardTitle>My Profile</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          You can update your display name. Email and password cannot be changed by administrators — only you can manage those through account settings.
        </p>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input name="name" defaultValue={name} required minLength={2} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Input value={roleLabel} disabled className="bg-muted" />
          </div>
          <Button type="submit" variant="gradient" disabled={pending}>Save Changes</Button>
        </form>
      </CardContent>
    </Card>
  );
}
