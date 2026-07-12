import { getCompanies, getCompanyStats, getPendingApplications } from "@/actions/company.actions";
import { getDivisions } from "@/actions/location.actions";
import { getDashboardAccess } from "@/lib/auth-server";
import { CompaniesContent, type CompaniesContentProps } from "@/features/companies/companies-content";
import { redirect } from "next/navigation";
import { serializeForClient } from "@/lib/serialize";

export default async function CompaniesPage() {
  const access = await getDashboardAccess();
  if (access.isCompanyAdmin) redirect("/dashboard");

  const [initial, stats, pendingApps, divisions] = await Promise.all([
    getCompanies(1, 25),
    getCompanyStats(),
    access.isSuperAdmin ? getPendingApplications() : Promise.resolve([]),
    getDivisions(),
  ]);

  return (
    <CompaniesContent
      initial={serializeForClient(initial) as CompaniesContentProps["initial"]}
      pending={serializeForClient(pendingApps) as CompaniesContentProps["pending"]}
      stats={stats}
      isSuperAdmin={access.isSuperAdmin}
      divisions={serializeForClient(divisions)}
    />
  );
}
