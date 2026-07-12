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

async function SearchContent({
  initialDestination,
  initialSource,
}: {
  initialDestination?: string;
  initialSource?: string;
}) {
  const divisions = await getDivisions();
  return (
    <SearchBusesContent
      divisions={serializeForClient(divisions)}
      initialDestination={initialDestination}
      initialSource={initialSource}
    />
  );
}

export default async function PublicSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ destination?: string; source?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="min-h-screen mesh-bg">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold text-sm hover:opacity-80">
            <ArrowLeft className="h-4 w-4" />
            {APP_NAME}
          </Link>
          <div className="flex items-center gap-2">
            <LinkButton href="/login" variant="ghost">Sign in</LinkButton>
            <LinkButton href="/register" variant="gradient">Get Started</LinkButton>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 page-enter">
        <Suspense fallback={<SearchSkeleton />}>
          <SearchContent
            initialDestination={params.destination}
            initialSource={params.source}
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
