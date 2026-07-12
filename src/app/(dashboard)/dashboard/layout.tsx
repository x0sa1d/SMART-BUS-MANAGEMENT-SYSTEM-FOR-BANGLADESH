import { getDashboardAccess } from "@/lib/auth-server";
import { AppLayoutClient } from "@/components/layout/app-layout";
import { PermissionsProvider } from "@/components/providers/permissions-provider";
import { getAdminNavItems } from "@/constants";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const access = await getDashboardAccess();
  const navItems = getAdminNavItems({
    isSuperAdmin: access.isSuperAdmin,
    isPlatformAdmin: access.isPlatformAdmin,
    isCompanyAdmin: access.isCompanyAdmin,
  });

  return (
    <PermissionsProvider value={access}>
      <AppLayoutClient type="admin" navItems={navItems}>
        {children}
      </AppLayoutClient>
    </PermissionsProvider>
  );
}
