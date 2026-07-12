import Link from "next/link";
import { getCompanies, getCompanyStats } from "@/actions/company.actions";
import { LinkButton } from "@/components/ui/link-button";
import { Badge } from "@/components/ui/badge";
import { APP_NAME } from "@/constants";
import { MAJOR_OPERATORS } from "@/constants/operators";
import { OperatorsSearchList } from "@/features/operators/operators-search-list";
import { ArrowLeft } from "lucide-react";

export default async function PublicOperatorsPage() {
  const [{ items, total }, stats] = await Promise.all([
    getCompanies(1, 50),
    getCompanyStats(),
  ]);

  return (
    <div className="min-h-screen mesh-bg">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold text-sm hover:opacity-80">
            <ArrowLeft className="h-4 w-4" />
            {APP_NAME}
          </Link>
          <div className="flex items-center gap-2">
            <LinkButton href="/search" variant="ghost">Search & Book</LinkButton>
            <LinkButton href="/register-company" variant="gradient">Register Operator</LinkButton>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-10 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">486+ Bus Operators</h1>
          <p className="text-muted-foreground">{stats.total.toLocaleString()} registered operators across Bangladesh</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {MAJOR_OPERATORS.map((name) => (
            <Badge key={name} variant="outline">{name}</Badge>
          ))}
        </div>
        <OperatorsSearchList initial={items} total={total} />
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/register-company" className="text-primary hover:underline">Join as an operator</Link>
        </p>
      </main>
    </div>
  );
}
