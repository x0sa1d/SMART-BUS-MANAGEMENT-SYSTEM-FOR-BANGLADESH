"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  approveCompany,
  rejectCompany,
  createCompanyManual,
} from "@/actions/company.actions";
import { MAJOR_OPERATORS } from "@/constants/operators";
import { Building2, Bus, Star, Search, Plus, Check, X, Clock } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Company = {
  id: string;
  name: string;
  code: string;
  status: string;
  fleetSize: number;
  rating: number;
  isNational: boolean;
  phone: string | null;
  email: string | null;
  contactName: string | null;
  appliedAt: string | Date | null;
  rejectionReason: string | null;
  district: { name: string; division: { name: string } } | null;
  _count: { buses: number; drivers: number; users: number };
  users?: { id: string; name: string; email: string }[];
};

type Division = { id: string; name: string; districts: { id: string; name: string }[] };

export type CompaniesContentProps = {
  initial: { items: Company[]; total: number; page: number; totalPages: number };
  pending: Company[];
  stats: { total: number; active: number; national: number; pending: number; rejected: number };
  isSuperAdmin: boolean;
  divisions: Division[];
};

interface Props extends CompaniesContentProps {}

export function CompaniesContent({ initial, pending, stats, isSuperAdmin, divisions }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isSubmitting, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [districtId, setDistrictId] = useState("");

  const filtered = search
    ? initial.items.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : initial.items;

  const handleApprove = (id: string, name: string) => {
    if (!confirm(`Approve "${name}"? They will get dashboard access.`)) return;
    startTransition(async () => {
      const result = await approveCompany(id);
      if (result.success) { toast.success("Company approved"); router.refresh(); }
      else toast.error(result.error);
    });
  };

  const handleReject = (companyId: string) => {
    if (!rejectReason.trim()) { toast.error("Enter a rejection reason"); return; }
    startTransition(async () => {
      const fd = new FormData();
      fd.set("companyId", companyId);
      fd.set("reason", rejectReason);
      const result = await rejectCompany(fd);
      if (result.success) {
        toast.success("Application rejected");
        setRejectOpen(null);
        setRejectReason("");
        router.refresh();
      } else toast.error(result.error);
    });
  };

  const handleAddCompany = (formData: FormData) => {
    if (districtId) formData.set("districtId", districtId);
    startTransition(async () => {
      const result = await createCompanyManual(formData);
      if (result.success) {
        toast.success("Company created");
        setAddOpen(false);
        router.refresh();
      } else toast.error(result.error);
    });
  };

  const statusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      ACTIVE: "default",
      PENDING: "secondary",
      REJECTED: "destructive",
      SUSPENDED: "destructive",
    };
    return <Badge variant={variants[status] ?? "outline"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Bus Companies</h1>
          <p className="text-muted-foreground">
            {stats.total.toLocaleString()} operators · {stats.pending} pending review
          </p>
        </div>
        {isSuperAdmin && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient"><Plus className="h-4 w-4" /> Add Company</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Add Company Manually</DialogTitle></DialogHeader>
              <form action={handleAddCompany} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2"><Label>Company Name</Label><Input name="name" required /></div>
                  <div className="space-y-2"><Label>Code</Label><Input name="code" required placeholder="GLP-001" /></div>
                  <div className="space-y-2"><Label>Fleet Size</Label><Input name="fleetSize" type="number" defaultValue="10" /></div>
                  <div className="space-y-2"><Label>Email</Label><Input name="email" type="email" /></div>
                  <div className="space-y-2"><Label>Phone</Label><Input name="phone" /></div>
                  <div className="space-y-2 sm:col-span-2"><Label>Address</Label><Textarea name="address" rows={2} /></div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>District</Label>
                    <Select value={districtId} onValueChange={setDistrictId}>
                      <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                      <SelectContent className="max-h-60">
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
                </div>
                <div className="border-t pt-4 space-y-3">
                  <p className="text-sm font-medium">Optional: create manager login</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Contact Name</Label><Input name="contactName" /></div>
                    <div className="space-y-2"><Label>Manager Email</Label><Input name="managerEmail" type="email" /></div>
                    <div className="space-y-2 sm:col-span-2"><Label>Manager Password</Label><Input name="managerPassword" type="password" minLength={8} /></div>
                  </div>
                </div>
                <Button type="submit" variant="gradient" className="w-full" disabled={isSubmitting}>Create Active Company</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Total", value: stats.total, icon: Building2 },
          { label: "Active", value: stats.active, icon: Bus },
          { label: "National", value: stats.national, icon: Star },
          { label: "Pending", value: stats.pending, icon: Clock },
          { label: "Rejected", value: stats.rejected, icon: X },
        ].map((s) => (
          <Card key={s.label} className="card-elevated">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2"><s.icon className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-2xl font-bold">{s.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue={stats.pending > 0 && isSuperAdmin ? "applications" : "all"}>
        <TabsList>
          <TabsTrigger value="all">All Companies</TabsTrigger>
          {isSuperAdmin && (
            <TabsTrigger value="applications">
              Applications {stats.pending > 0 && `(${stats.pending})`}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="applications" className="space-y-4 mt-4">
          {pending.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No pending applications</p>
          ) : (
            pending.map((app) => (
              <Card key={app.id} className="card-elevated border-[#FFB703]/30">
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{app.name}</h3>
                        {statusBadge(app.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{app.code} · {app.email} · {app.phone}</p>
                      <p className="text-sm">{app.contactName} · Fleet ~{app.fleetSize}</p>
                      {app.district && (
                        <p className="text-xs text-muted-foreground">{app.district.name}, {app.district.division.name}</p>
                      )}
                      {app.users?.[0] && (
                        <p className="text-xs text-muted-foreground">Login: {app.users[0].email}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="gradient" disabled={isSubmitting} onClick={() => handleApprove(app.id, app.name)}>
                        <Check className="h-4 w-4" /> Approve
                      </Button>
                      <Dialog open={rejectOpen === app.id} onOpenChange={(o) => !o && setRejectOpen(null)}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => setRejectOpen(app.id)}>
                            <X className="h-4 w-4" /> Reject
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Reject Application</DialogTitle></DialogHeader>
                          <div className="space-y-4">
                            <Textarea
                              placeholder="Reason for rejection..."
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              rows={3}
                            />
                            <Button variant="destructive" className="w-full" disabled={isSubmitting} onClick={() => handleReject(app.id)}>
                              Confirm Rejection
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4 mt-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search operators..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="grid gap-3">
            {filtered.map((company) => (
              <Card key={company.id} className="card-elevated">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl gradient-primary text-white font-bold text-sm">
                      {company.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{company.name}</h3>
                        {company.isNational && <Badge variant="warning">National</Badge>}
                        {statusBadge(company.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {company.code}
                        {company.district && ` · ${company.district.name}, ${company.district.division.name}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span><strong>{company.fleetSize}</strong> fleet</span>
                    <span><strong>{company._count.buses}</strong> buses</span>
                    <span className="flex items-center gap-1"><Star className="h-3 w-3 text-[#FFB703]" /> {company.rating.toFixed(1)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Showing {filtered.length} of {initial.total.toLocaleString()} (page {initial.page}/{initial.totalPages})
          </p>
        </TabsContent>
      </Tabs>

      <Card className="card-elevated">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">Major National Operators</h3>
          <div className="flex flex-wrap gap-2">
            {MAJOR_OPERATORS.map((name) => (
              <Badge key={name} variant="outline" className="text-xs">{name}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
