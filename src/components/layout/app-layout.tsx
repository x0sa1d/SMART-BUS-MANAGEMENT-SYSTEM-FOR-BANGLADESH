"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { TopNav } from "./top-nav";
import { DRIVER_NAV_ITEMS, PASSENGER_NAV_ITEMS, ADMIN_NAV_ITEMS, type AdminNavItem } from "@/constants";
import { ReadOnlyBanner } from "@/components/shared/read-only-banner";

type LayoutType = "admin" | "driver" | "passenger";

const navMap = { admin: ADMIN_NAV_ITEMS, driver: DRIVER_NAV_ITEMS, passenger: PASSENGER_NAV_ITEMS };
const profileMap = { admin: "/dashboard/profile", driver: "/driver/profile", passenger: "/passenger/profile" };

export function AppLayoutClient({
  children,
  type = "admin",
  navItems,
}: {
  children: React.ReactNode;
  type?: LayoutType;
  navItems?: readonly AdminNavItem[];
}) {
  const [collapsed, setCollapsed] = useState(false);
  const items = navItems ?? navMap[type];
  const profileHref = profileMap[type];

  return (
    <div className="flex h-screen overflow-hidden mesh-bg">
      <Sidebar items={items} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav navItems={items} profileHref={profileHref} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {type === "admin" && <ReadOnlyBanner />}
          {children}
        </main>
      </div>
    </div>
  );
}
