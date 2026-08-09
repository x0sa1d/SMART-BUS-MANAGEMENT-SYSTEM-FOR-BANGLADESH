import { readFileSync } from "fs";
import { join } from "path";
import { db, excludeDeleted } from "@/lib/db";
import { calculateFare } from "@/lib/geo";

const DATA_DIR = join(process.cwd(), "data", "bangladesh_bus_management_dataset_v1");

type CsvRow = Record<string, string>;

function parseCsv(content: string): CsvRow[] {
  const lines = content.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    const row: CsvRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    return row;
  });
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  result.push(current.trim());
  return result;
}

function readCsv(fileName: string): CsvRow[] {
  return parseCsv(readFileSync(join(DATA_DIR, fileName), "utf8"));
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/['']/g, "'");
}

const DISTRICT_ALIASES: Record<string, string> = {
  chittagong: "chattogram",
  jessore: "jashore",
  barisal: "barishal",
  bogra: "bogura",
  comilla: "cumilla",
  "cox's bazar": "cox's bazar",
  coxsbazar: "cox's bazar",
  jhalokathi: "jhalokati",
  jhalokati: "jhalokati",
};

function resolveDistrictName(name: string, byName: Map<string, { id: string; name: string }>) {
  const key = normalizeName(name);
  const aliased = DISTRICT_ALIASES[key] ?? key;
  return byName.get(aliased) ?? byName.get(key) ?? null;
}

export async function seedDatasetRoutes() {
  console.log("Seeding routes from bangladesh_bus_management_dataset_v1...");

  const routeRows = readCsv("routes_320.csv");
  const stopRows = readCsv("route_stops.csv");

  const districts = await db.district.findMany({ where: excludeDeleted() });
  const byName = new Map(districts.map((d) => [normalizeName(d.name), d]));

  const routeIdByDatasetId = new Map<string, string>();
  let routesUpserted = 0;
  let routesSkipped = 0;

  for (const row of routeRows) {
    const origin = resolveDistrictName(row.origin_district, byName);
    const destination = resolveDistrictName(row.destination_district, byName);
    if (!origin || !destination) {
      routesSkipped++;
      continue;
    }

    const distance = Math.max(1, Number(row.distance_km_est) || 1);
    const duration = Math.max(30, Number(row.duration_min_est) || 60);
    const name = row.route_name?.trim() || `${origin.name} - ${destination.name}`;

    const route = await db.route.upsert({
      where: {
        sourceDistrictId_destinationDistrictId: {
          sourceDistrictId: origin.id,
          destinationDistrictId: destination.id,
        },
      },
      update: {
        name,
        source: origin.name,
        destination: destination.name,
        distance,
        estimatedDuration: duration,
        isActive: true,
        deletedAt: null,
      },
      create: {
        name,
        source: origin.name,
        destination: destination.name,
        sourceDistrictId: origin.id,
        destinationDistrictId: destination.id,
        distance,
        estimatedDuration: duration,
        isActive: true,
      },
    });

    routeIdByDatasetId.set(row.route_id, route.id);
    routesUpserted++;
  }

  const stopCache = new Map<string, string>();
  let stopsCreated = 0;
  let routeStopsLinked = 0;

  for (const row of stopRows) {
    const routeId = routeIdByDatasetId.get(row.route_id);
    if (!routeId) continue;

    const district = resolveDistrictName(row.district, byName);
    const stopName = row.stop_name.trim();
    const city = district?.name || row.district.trim();
    const cacheKey = `${normalizeName(city)}::${normalizeName(stopName)}`;

    let stopId = stopCache.get(cacheKey);
    if (!stopId) {
      const existing = await db.stop.findFirst({
        where: {
          name: stopName,
          city,
          deletedAt: null,
        },
      });

      if (existing) {
        stopId = existing.id;
        if (district && !existing.districtId) {
          await db.stop.update({
            where: { id: existing.id },
            data: { districtId: district.id },
          });
        }
      } else {
        const stopType =
          row.stop_type === "origin" || row.stop_type === "destination"
            ? "TERMINAL"
            : "BUS_STAND";
        const created = await db.stop.create({
          data: {
            name: stopName,
            city,
            districtId: district?.id,
            stopType,
            isTerminal: row.stop_type === "origin" || row.stop_type === "destination",
          },
        });
        stopId = created.id;
        stopsCreated++;
      }
      stopCache.set(cacheKey, stopId);
    }

    const order = Number(row.stop_sequence) || 1;
    await db.routeStop.upsert({
      where: {
        routeId_stopId: {
          routeId,
          stopId,
        },
      },
      update: { order },
      create: {
        routeId,
        stopId,
        order,
      },
    });
    routeStopsLinked++;
  }

  console.log(
    `Dataset routes: upserted ${routesUpserted}, skipped ${routesSkipped}, stops +${stopsCreated}, route-stops ${routeStopsLinked}`
  );
}

/** Create bookable schedules/trips from services_demo.csv using existing buses. */
export async function seedDatasetServices(limit = 80) {
  console.log("Seeding schedules from dataset services_demo.csv...");

  const serviceRows = readCsv("services_demo.csv").slice(0, limit);
  const routeRows = readCsv("routes_320.csv");
  const routeMeta = new Map(routeRows.map((row) => [row.route_id, row]));

  const districts = await db.district.findMany({ where: excludeDeleted() });
  const byName = new Map(districts.map((d) => [normalizeName(d.name), d]));

  const buses = await db.bus.findMany({
    where: excludeDeleted(),
    take: 40,
    orderBy: { createdAt: "asc" },
  });
  const drivers = await db.driver.findMany({
    where: excludeDeleted(),
    take: 40,
    orderBy: { createdAt: "asc" },
  });

  if (buses.length === 0 || drivers.length === 0) {
    console.log("No buses/drivers available; skipped dataset service schedules");
    return;
  }

  const baseDate = new Date();
  baseDate.setUTCHours(0, 0, 0, 0);

  let schedules = 0;
  let tripsCreated = 0;
  let i = 0;

  for (const service of serviceRows) {
    const meta = routeMeta.get(service.route_id);
    if (!meta) continue;

    const origin = resolveDistrictName(meta.origin_district, byName);
    const destination = resolveDistrictName(meta.destination_district, byName);
    if (!origin || !destination) continue;

    const route = await db.route.findUnique({
      where: {
        sourceDistrictId_destinationDistrictId: {
          sourceDistrictId: origin.id,
          destinationDistrictId: destination.id,
        },
      },
    });
    if (!route) continue;

    const bus = buses[i % buses.length];
    const driver = drivers[i % drivers.length];
    const fareEstimate = Number(meta.fare_bdt_est);
    const fare = Number.isFinite(fareEstimate) && fareEstimate > 0
      ? fareEstimate
      : calculateFare(route.distance);
    const departureTime = service.departure_time?.trim() || "08:00";
    const durationHours = Math.max(1, Math.round((route.estimatedDuration || 180) / 60));
    const [hh, mm] = departureTime.split(":").map(Number);
    const arrivalHour = ((Number.isFinite(hh) ? hh : 8) + durationHours) % 24;
    const arrivalTime = `${String(arrivalHour).padStart(2, "0")}:${String(Number.isFinite(mm) ? mm : 0).padStart(2, "0")}`;

    let schedule = await db.schedule.findFirst({
      where: {
        routeId: route.id,
        busId: bus.id,
        departureTime,
        deletedAt: null,
      },
    });

    if (!schedule) {
      schedule = await db.schedule.create({
        data: {
          routeId: route.id,
          busId: bus.id,
          driverId: driver.id,
          departureTime,
          arrivalTime,
          fare,
          daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          isActive: true,
        },
      });
      schedules++;
    }

    const existingTripCount = await db.trip.count({
      where: { scheduleId: schedule.id, deletedAt: null },
    });
    if (existingTripCount === 0) {
      const tripRows = Array.from({ length: 14 }, (_, dayOffset) => {
        const tripDate = new Date(baseDate);
        tripDate.setUTCDate(tripDate.getUTCDate() + dayOffset);
        return {
          scheduleId: schedule!.id,
          busId: bus.id,
          driverId: driver.id,
          tripDate,
          status: "SCHEDULED" as const,
        };
      });
      const result = await db.trip.createMany({ data: tripRows });
      tripsCreated += result.count;
    }
    i++;
  }

  console.log(
    `Dataset services: ${schedules} new schedules, ${tripsCreated} trips across ${serviceRows.length} services`
  );
}
