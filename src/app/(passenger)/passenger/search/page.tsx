import { Suspense } from "react";
import { getDivisions } from "@/actions/location.actions";
import { SearchBusesContent } from "@/features/passenger/search-content";
import { SearchSkeleton } from "@/components/shared/skeleton-loaders";
import { serializeForClient } from "@/lib/serialize";

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

export default async function PassengerSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ destination?: string; source?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="page-enter">
      <Suspense fallback={<SearchSkeleton />}>
        <SearchContent
          initialDestination={params.destination}
          initialSource={params.source}
        />
      </Suspense>
    </div>
  );
}
