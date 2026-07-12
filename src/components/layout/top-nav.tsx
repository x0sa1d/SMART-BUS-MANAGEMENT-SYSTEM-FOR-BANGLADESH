"use client";

import { signOut, useSession } from "@/lib/auth-client";
import { clearHomePathCookie } from "@/lib/redirect";
import { useRouter } from "next/navigation";
import { LogOut, User, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { MobileSidebar } from "./mobile-sidebar";
import { usePermissions } from "@/components/providers/permissions-provider";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";

interface NavItem { title: string; href: string; icon: string; }

export function TopNav({ navItems, title, profileHref = "/dashboard/settings" }: { navItems: readonly NavItem[]; title?: string; profileHref?: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const { roleLabel, isSuperAdmin, isAdmin } = usePermissions();

  const handleSignOut = async () => {
    await signOut();
    clearHomePathCookie();
    toast.success("Signed out successfully");
    router.refresh();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border/60 bg-background/80 backdrop-blur-xl px-4 md:px-6">
      <MobileSidebar items={navItems} />
      {title && <h1 className="text-lg font-semibold hidden sm:block">{title}</h1>}
      {(isSuperAdmin || isAdmin) && (
        <Badge variant={isSuperAdmin ? "default" : "secondary"} className="hidden sm:inline-flex">
          {roleLabel}
        </Badge>
      )}
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-9 w-9 relative"><Bell className="h-4 w-4" /></Button>
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={session?.user?.image || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">{getInitials(session?.user?.name || "U")}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <div className="flex items-center gap-2 p-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">{getInitials(session?.user?.name || "U")}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <p className="text-sm font-medium">{session?.user?.name}</p>
                <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(profileHref)}>
              <User className="mr-2 h-4 w-4" />Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
