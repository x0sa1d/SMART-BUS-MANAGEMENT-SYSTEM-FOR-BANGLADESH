import { Suspense } from "react";
import { getDivisions } from "@/actions/location.actions";
import { SearchBusesContent } from "@/features/passenger/search-content";
import { SearchSkeleton } from "@/components/shared/skeleton-loaders";
import { serializeForClient } from "@/lib/serialize";
import Link from "next/link";
import { LinkButton } from "@/components/ui/link-button";
import { APP_NAME } from "@/constants";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function normalizeCity(value: string): string {
  return value.trim();
}

async function SearchContent({
  initialDestination,
  initialSource,
  initialDate,
  initialPassengers,
}: {
  initialDestination?: string;
  initialSource?: string;
  initialDate?: string;
  initialPassengers?: number;
}) {
  const divisions = await getDivisions();
  return (
    <SearchBusesContent
      divisions={serializeForClient(divisions)}
      initialDestination={initialDestination}
      initialSource={initialSource}
      initialDate={initialDate}
      initialPassengers={initialPassengers}
    />
  );
}

export default async function PublicSearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const source = normalizeCity(firstParam(params.source) || firstParam(params.from));
  const destination = normalizeCity(firstParam(params.destination) || firstParam(params.to));
  const date = firstParam(params.date).trim();
  const passengersRaw = Number(firstParam(params.passengers) || "1");
  const passengers = Number.isFinite(passengersRaw)
    ? Math.min(10, Math.max(1, Math.floor(passengersRaw)))
    : 1;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <header className="sticky top-0 z-50 site-header text-white">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold text-sm text-white hover:opacity-90">
            <ArrowLeft className="h-4 w-4" />
            {APP_NAME}
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <LinkButton href="/login" className="bg-white/10 text-white hover:bg-white/20 border-0 hidden sm:inline-flex text-xs sm:text-sm px-3">Sign in</LinkButton>
            <LinkButton href="/register" className="bg-accent text-white hover:bg-accent/90 border-0 text-xs sm:text-sm px-3 sm:px-4">Get Started</LinkButton>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 page-enter space-y-4">
        {!process.env.DATABASE_URL ||
        process.env.DATABASE_URL.includes("[YOUR-PASSWORD]") ? (
          <div className="rounded-lg border border-amber-300 bg-amber-50 text-amber-900 px-4 py-3 text-sm">
            Database password is not set yet. Add your Supabase DB password to{" "}
            <code className="font-mono">.env</code> to enable live search and booking.
          </div>
        ) : null}
        <Suspense fallback={<SearchSkeleton />}>
          <SearchContent
            initialDestination={destination}
            initialSource={source}
            initialDate={date || undefined}
            initialPassengers={passengers}
          />
        </Suspense>
        <p className="text-center text-sm text-muted-foreground mt-8">
          <Link href="/login?next=/passenger/search" className="text-primary font-medium hover:underline">Sign in</Link>
          {" to book tickets, or "}
          <Link href="/register" className="text-primary font-medium hover:underline">create a free account</Link>.
        </p>
      </main>
    </div>
  );
}
