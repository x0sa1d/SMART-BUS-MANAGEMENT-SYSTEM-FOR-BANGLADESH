import { Suspense } from "react";
import { getDivisions } from "@/actions/location.actions";
import { SearchBusesContent } from "@/features/passenger/search-content";
import { SearchSkeleton } from "@/components/shared/skeleton-loaders";
import { serializeForClient } from "@/lib/serialize";

export const dynamic = "force-dynamic";

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
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

export default async function PassengerSearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const source = (firstParam(params.source) || firstParam(params.from)).trim();
  const destination = (firstParam(params.destination) || firstParam(params.to)).trim();
  const date = firstParam(params.date).trim();
  const passengersRaw = Number(firstParam(params.passengers) || "1");
  const passengers = Number.isFinite(passengersRaw)
    ? Math.min(10, Math.max(1, Math.floor(passengersRaw)))
    : 1;

  return (
    <div className="page-enter">
      <Suspense fallback={<SearchSkeleton />}>
        <SearchContent
          initialDestination={destination}
          initialSource={source}
          initialDate={date || undefined}
          initialPassengers={passengers}
        />
      </Suspense>
    </div>
  );
}
