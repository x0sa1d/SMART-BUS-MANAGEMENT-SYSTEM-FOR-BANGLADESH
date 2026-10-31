/** Cities passengers can still pick when the district table is unreachable. */
export const FALLBACK_PASSENGER_CITIES = [
  "Dhaka",
  "Chittagong",
  "Chattogram",
  "Sylhet",
  "Rajshahi",
  "Khulna",
  "Barishal",
  "Rangpur",
  "Mymensingh",
  "Cox's Bazar",
  "Cumilla",
  "Jessore",
  "Bogura",
] as const;

/** Alternate spellings and legacy names for district search matching. */
const DISTRICT_ALIASES: Record<string, string[]> = {
  chattogram: ["Chittagong", "Chattogram", "CTG"],
  chittagong: ["Chattogram", "Chittagong", "CTG"],
  coxsbazar: ["Cox's Bazar", "Coxs Bazar", "Cox's Bazar"],
  "cox's bazar": ["Cox's Bazar", "Coxs Bazar", "Cox's Bazar"],
  jashore: ["Jessore", "Jashore"],
  jessore: ["Jessore", "Jashore"],
  barishal: ["Barisal", "Barishal"],
  barisal: ["Barisal", "Barishal"],
  bogura: ["Bogra", "Bogura"],
  bogra: ["Bogra", "Bogura"],
  cumilla: ["Comilla", "Cumilla"],
  comilla: ["Comilla", "Cumilla"],
  moulvibazar: ["Moulvibazar", "Maulvibazar"],
  chapainawabganj: ["Chapai Nawabganj", "Chapainawabganj"],
};

export function getDistrictSearchVariants(name: string): string[] {
  const trimmed = name.trim();
  const key = trimmed.toLowerCase().replace(/['']/g, "'");
  const aliases = DISTRICT_ALIASES[key] ?? [];
  const variants = new Set<string>([trimmed, ...aliases]);
  return Array.from(variants);
}

const CANONICAL_CITY_KEY: Record<string, string> = {
  chittagong: "chattogram",
  chattogram: "chattogram",
  ctg: "chattogram",
  "cox's bazar": "cox's bazar",
  "coxs bazar": "cox's bazar",
  jessore: "jashore",
  jashore: "jashore",
  barisal: "barishal",
  barishal: "barishal",
  bogra: "bogura",
  bogura: "bogura",
  comilla: "cumilla",
  cumilla: "cumilla",
  maulvibazar: "moulvibazar",
  moulvibazar: "moulvibazar",
  "chapai nawabganj": "chapainawabganj",
  chapainawabganj: "chapainawabganj",
};

/** Canonical key so Chittagong / Chattogram (and similar aliases) count as one city. */
export function canonicalCityKey(name: string): string {
  const key = name.trim().toLowerCase().replace(/['']/g, "'");
  return CANONICAL_CITY_KEY[key] ?? key;
}

export function isSameCity(a: string, b: string): boolean {
  const left = canonicalCityKey(a);
  const right = canonicalCityKey(b);
  return Boolean(left) && left === right;
}

export function buildDistrictFieldFilter(field: "source" | "destination", name: string) {
  const variants = getDistrictSearchVariants(name);
  return {
    OR: variants.flatMap((variant) => [
      { [field]: { equals: variant, mode: "insensitive" as const } },
    ]),
  };
}

export function buildRouteMatchFilter(source: string, destination: string) {
  const sourceVariants = getDistrictSearchVariants(source);
  const destVariants = getDistrictSearchVariants(destination);

  return {
    deletedAt: null,
    OR: [
      {
        AND: [
          { OR: sourceVariants.map((v) => ({ source: { equals: v, mode: "insensitive" as const } })) },
          { OR: destVariants.map((v) => ({ destination: { equals: v, mode: "insensitive" as const } })) },
        ],
      },
      {
        AND: [
          { OR: sourceVariants.map((v) => ({ sourceDistrict: { name: { equals: v, mode: "insensitive" as const } } })) },
          { OR: destVariants.map((v) => ({ destinationDistrict: { name: { equals: v, mode: "insensitive" as const } } })) },
        ],
      },
    ],
  };
}

export function buildDestinationMatchFilter(destination: string) {
  const destVariants = getDistrictSearchVariants(destination);

  return {
    deletedAt: null,
    OR: [
      { OR: destVariants.map((v) => ({ destination: { equals: v, mode: "insensitive" as const } })) },
      { OR: destVariants.map((v) => ({ destinationDistrict: { name: { equals: v, mode: "insensitive" as const } } })) },
    ],
  };
}

/** Match admin-managed routes by destination; optionally narrow by source. */
export function buildPassengerRouteFilter(destination: string, source?: string) {
  if (source?.trim()) {
    return buildRouteMatchFilter(source.trim(), destination);
  }
  return buildDestinationMatchFilter(destination);
}

export function addDaysUtc(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}
