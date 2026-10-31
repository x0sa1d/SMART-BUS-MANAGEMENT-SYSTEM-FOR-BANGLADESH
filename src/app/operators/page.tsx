import Link from "next/link";
import { getCompanies, getCompanyStats } from "@/actions/company.actions";
import { LinkButton } from "@/components/ui/link-button";
import { Badge } from "@/components/ui/badge";
import { APP_NAME } from "@/constants";
import { MAJOR_OPERATORS } from "@/constants/operators";
import { OperatorsSearchList } from "@/features/operators/operators-search-list";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PublicOperatorsPage() {
  let items: Awaited<ReturnType<typeof getCompanies>>["items"] = [];
  let total = 0;
  let stats = { total: 0, active: 0, national: 0, pending: 0, rejected: 0 };
  let dbOk = true;

  try {
    const [companies, companyStats] = await Promise.all([
      getCompanies(1, 50),
      getCompanyStats(),
    ]);
    items = companies.items;
    total = companies.total;
    stats = companyStats;
  } catch {
    dbOk = false;
  }

  // Fallback marketing list when DB is offline / not configured
  const fallback =
    items.length === 0
      ? MAJOR_OPERATORS.map((name, i) => ({
          id: `fallback-${i}`,
          name,
          rating: 4.5,
          fleetSize: 0,
          district: null,
        }))
      : items;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 site-header text-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold text-sm text-white hover:opacity-90">
            <ArrowLeft className="h-4 w-4" />
            {APP_NAME}
          </Link>
          <div className="flex items-center gap-2">
            <LinkButton href="/search" className="bg-white/10 text-white hover:bg-white/20 border border-white/25 hidden sm:inline-flex">Search & Book</LinkButton>
            <LinkButton href="/register-company" className="bg-accent text-white hover:bg-accent/90 border-0">Register Operator</LinkButton>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-10 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">486+ Bus Operators</h1>
          <p className="text-muted-foreground">
            {(stats.total || MAJOR_OPERATORS.length).toLocaleString()} operators across Bangladesh
          </p>
          {!dbOk && (
            <p className="text-sm text-amber-600">
              Database not connected. Add your Supabase DB password to `.env` to load live data.
            </p>
          )}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {MAJOR_OPERATORS.map((name) => (
            <Badge key={name} variant="outline">{name}</Badge>
          ))}
        </div>
        <OperatorsSearchList initial={fallback} total={total || fallback.length} />
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/register-company" className="text-primary hover:underline">Join as an operator</Link>
        </p>
      </main>
    </div>
  );
}
