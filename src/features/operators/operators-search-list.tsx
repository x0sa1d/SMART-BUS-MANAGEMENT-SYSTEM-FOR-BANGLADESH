"use client";

import { useState, useTransition, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { searchActiveCompanies } from "@/actions/company.actions";
import { Search, Star } from "lucide-react";

type Company = {
  id: string;
  name: string;
  rating: number;
  fleetSize: number;
  district?: { name: string } | null;
};

export function OperatorsSearchList({ initial, total }: { initial: Company[]; total: number }) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState(initial);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(async () => {
        const results = await searchActiveCompanies(query || undefined);
        setItems(results);
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="space-y-6">
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-10"
          placeholder="Search bus companies..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="grid gap-3 max-w-3xl mx-auto">
        {items.map((company) => (
          <Card key={company.id} className="card-elevated">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-xl gradient-primary text-white flex items-center justify-center font-bold shrink-0">
                  {company.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{company.name}</p>
                  <p className="text-xs text-muted-foreground">{company.fleetSize} buses</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm shrink-0">
                <Star className="h-3 w-3 text-[#FFB703]" />
                {company.rating.toFixed(1)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-center text-sm text-muted-foreground">
        {pending ? "Searching..." : `Showing ${items.length} of ${total.toLocaleString()} operators`}
      </p>
    </div>
  );
}
