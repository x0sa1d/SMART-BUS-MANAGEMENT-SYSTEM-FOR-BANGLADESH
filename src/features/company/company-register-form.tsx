"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn, authClient } from "@/lib/auth-client";
import { setHomePathCookie } from "@/lib/redirect";
import { resolvePostLoginPath } from "@/lib/auth-flow";
import { submitCompanyApplication } from "@/actions/company.actions";
import { companyApplicationSchema, type CompanyApplicationInput } from "@/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@/constants";
import { toast } from "sonner";
import { Loader2, Building2 } from "lucide-react";

type Division = {
  id: string;
  name: string;
  districts: { id: string; name: string }[];
};

export function CompanyRegisterForm({ divisions }: { divisions: Division[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [districtId, setDistrictId] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<CompanyApplicationInput>({
    resolver: zodResolver(companyApplicationSchema),
    defaultValues: { fleetSize: 5 },
  });

  const onSubmit = (data: CompanyApplicationInput) => {
    startTransition(async () => {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => fd.set(k, String(v ?? "")));
      if (districtId) fd.set("districtId", districtId);

      const result = await submitCompanyApplication(fd);
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      const loginResult = await signIn.email({ email: data.contactEmail, password: data.password });
      if (loginResult.error) {
        toast.success("Application submitted! Sign in to track status.");
        router.push("/login");
        return;
      }

      await authClient.getSession();
      const home = await resolvePostLoginPath({ user: loginResult.data?.user ?? null });
      setHomePathCookie(home);
      toast.success("Application submitted! Awaiting admin approval.");
      router.refresh();
      router.push(home);
    });
  };

  return (
    <Card className="border border-border shadow-soft-lg max-w-2xl mx-auto overflow-hidden">
      <CardHeader className="text-center space-y-2">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-bd-green text-white">
          <Building2 className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl">Register Bus Company</CardTitle>
        <CardDescription>
          Apply to join {APP_NAME}. After review, you&apos;ll get access to your company dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-primary">Company Details</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label>Company Name</Label>
                <Input {...register("companyName")} placeholder="Green Line Paribahan" />
                {errors.companyName && <p className="text-sm text-destructive">{errors.companyName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Company Email</Label>
                <Input {...register("companyEmail")} type="email" placeholder="info@company.com" />
                {errors.companyEmail && <p className="text-sm text-destructive">{errors.companyEmail.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Company Phone</Label>
                <Input {...register("companyPhone")} placeholder="01XXXXXXXXX" />
                {errors.companyPhone && <p className="text-sm text-destructive">{errors.companyPhone.message}</p>}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Office Address</Label>
                <Textarea {...register("companyAddress")} placeholder="Full address in Bangladesh" rows={2} />
                {errors.companyAddress && <p className="text-sm text-destructive">{errors.companyAddress.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>District</Label>
                <Select value={districtId} onValueChange={setDistrictId}>
                  <SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {divisions.map((div) => (
                      <SelectGroup key={div.id}>
                        <SelectLabel>{div.name}</SelectLabel>
                        {div.districts.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fleet Size (approx.)</Label>
                <Input {...register("fleetSize")} type="number" min={1} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Website (optional)</Label>
                <Input {...register("website")} placeholder="https://example.com" />
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-sm text-primary">Account Owner</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Your Name</Label>
                <Input {...register("contactName")} placeholder="Owner / Manager name" />
                {errors.contactName && <p className="text-sm text-destructive">{errors.contactName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Login Email</Label>
                <Input {...register("contactEmail")} type="email" />
                {errors.contactEmail && <p className="text-sm text-destructive">{errors.contactEmail.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input {...register("password")} type="password" />
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Confirm Password</Label>
                <Input {...register("confirmPassword")} type="password" />
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
              </div>
            </div>
          </div>

          <Button type="submit" variant="gradient" className="w-full" disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit Application
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Passenger account? <Link href="/register" className="text-primary font-medium hover:underline">Register as passenger</Link>
          {" · "}
          <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      </CardContent>
    </Card>
  );
}
