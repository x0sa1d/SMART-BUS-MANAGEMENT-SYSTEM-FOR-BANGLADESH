"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, Bus, Route, Calendar, UserCog, Ticket, CreditCard,
  Wrench, BarChart3, TrendingUp, Settings, ChevronLeft, ChevronRight,
  Search, MapPin, User, Building2, UsersRound, ShieldCheck, ScanLine, Siren, PackageSearch, Navigation, Shield, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/constants";
import { Button } from "@/components/ui/button";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard, Users, Bus, Route, Calendar, UserCog, Ticket, CreditCard,
  Wrench, BarChart3, TrendingUp, Settings, Search, MapPin, User, Building2, UsersRound, ShieldCheck, ScanLine,
  Siren, PackageSearch, Navigation, Shield,
};

interface NavItem { title: string; href: string; icon: string; }

interface SidebarProps {
  items: readonly NavItem[];
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ items, collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="hidden md:flex flex-col border-r border-white/10 bg-bd-green text-white h-full shadow-soft"
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/15">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-bd-green text-sm font-bold">B</div>
              <span className="font-bold text-sm tracking-tight text-white">{APP_NAME}</span>
            </motion.div>
          )}
        </AnimatePresence>
        <Button variant="ghost" size="icon" className="h-11 w-11 text-white hover:bg-white/10 hover:text-white" onClick={onToggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {items.map((item) => {
          const Icon = iconMap[item.icon] || LayoutDashboard;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && item.href !== "/driver" && item.href !== "/passenger" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} title={collapsed ? item.title : undefined}
              className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 min-h-11",
                isActive ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10 hover:text-white",
                collapsed && "justify-center px-2")}>
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          );
        })}
      </nav>
    </motion.aside>
  );
}
