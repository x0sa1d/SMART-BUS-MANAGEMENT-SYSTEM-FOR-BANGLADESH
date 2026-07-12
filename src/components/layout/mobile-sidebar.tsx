"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Bus, Route, Calendar, UserCog, Ticket, CreditCard,
  Wrench, BarChart3, TrendingUp, Settings, Search, MapPin, User, Menu, Building2, UsersRound, ShieldCheck, ScanLine, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/constants";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard, Users, Bus, Route, Calendar, UserCog, Ticket, CreditCard,
  Wrench, BarChart3, TrendingUp, Settings, Search, MapPin, User, Building2, UsersRound, ShieldCheck, ScanLine,
};

interface NavItem { title: string; href: string; icon: string; }

export function MobileSidebar({ items }: { items: readonly NavItem[] }) {
  const pathname = usePathname();
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden"><Menu className="h-5 w-5" /></Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary text-white text-sm font-bold">SBM</div>
            {APP_NAME}
          </SheetTitle>
        </SheetHeader>
        <nav className="p-3 space-y-1">
          {items.map((item) => {
            const Icon = iconMap[item.icon] || LayoutDashboard;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href}
                className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")}>
                <Icon className="h-4 w-4" />{item.title}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
