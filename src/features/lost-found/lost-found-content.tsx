"use client";

import { useEffect, useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  claimLostFoundItem,
  createLostFoundItem,
  listLostFoundItems,
} from "@/actions/lost-found.actions";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { PackageSearch, Plus, Loader2 } from "lucide-react";

type Item = Awaited<ReturnType<typeof listLostFoundItems>>[number];

export function LostFoundContent({ admin = false }: { admin?: boolean }) {
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<"ALL" | "LOST" | "FOUND">("ALL");
  const [showForm, setShowForm] = useState(false);
  const [pending, startTransition] = useTransition();

  const [type, setType] = useState<"LOST" | "FOUND">("LOST");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const load = () => {
    startTransition(async () => {
      const data = await listLostFoundItems(
        filter === "ALL" ? undefined : { type: filter }
      );
      setItems(data);
    });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const submit = () => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("type", type);
      fd.set("title", title);
      fd.set("description", description);
      if (category) fd.set("category", category);
      if (location) fd.set("location", location);
      if (contactPhone) fd.set("contactPhone", contactPhone);

      const result = await createLostFoundItem(fd);
      if (result.success) {
        toast.success(result.data?.message || "Submitted");
        setShowForm(false);
        setTitle("");
        setDescription("");
        setCategory("");
        setLocation("");
        setContactPhone("");
        load();
      } else {
        toast.error(result.error || "Failed");
      }
    });
  };

  const claim = (id: string) => {
    startTransition(async () => {
      const result = await claimLostFoundItem(id);
      if (result.success) {
        toast.success(result.data?.message || "Claimed");
        load();
      } else {
        toast.error(result.error || "Failed");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lost & found</h1>
          <p className="text-muted-foreground text-[15px]">
            Report something you lost, or help return an item found on a trip
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="LOST">Lost</SelectItem>
              <SelectItem value="FOUND">Found</SelectItem>
            </SelectContent>
          </Select>
          {!admin && (
            <Button variant="gradient" onClick={() => setShowForm((s) => !s)}>
              <Plus className="h-4 w-4" /> Report Item
            </Button>
          )}
        </div>
      </div>

      {showForm && (
        <Card className="border-primary/20">
          <CardContent className="p-6 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as "LOST" | "FOUND")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOST">I lost something</SelectItem>
                  <SelectItem value="FOUND">I found something</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input
                placeholder="Phone, bag, documents…"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Title</Label>
              <Input
                placeholder="Black backpack near seat 12A"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the item and when/where it was last seen"
              />
            </div>
            <div className="space-y-2">
              <Label>Location / Terminal</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Contact phone</Label>
              <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Button variant="gradient" disabled={pending} onClick={submit}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageSearch className="h-4 w-4" />}
                Submit Report
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {items.length === 0 && !pending ? (
          <Card className="md:col-span-2">
            <CardContent className="p-10 text-center text-muted-foreground">
              No lost & found reports yet.
            </CardContent>
          </Card>
        ) : (
          items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(item.createdAt)}
                      {item.location ? ` · ${item.location}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Badge variant={item.type === "LOST" ? "destructive" : "default"}>
                      {item.type}
                    </Badge>
                    <Badge variant="outline">{item.status}</Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3">{item.description}</p>
                {item.category && (
                  <p className="text-xs">
                    Category: <strong>{item.category}</strong>
                  </p>
                )}
                {item.trip?.schedule?.route && (
                  <p className="text-xs text-muted-foreground">
                    Trip: {item.trip.schedule.route.source} → {item.trip.schedule.route.destination}
                    {item.trip.bus ? ` · Bus ${item.trip.bus.busNumber}` : ""}
                  </p>
                )}
                {item.status === "REPORTED" && item.type === "FOUND" && (
                  <Button size="sm" variant="outline" disabled={pending} onClick={() => claim(item.id)}>
                    Claim this item
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
