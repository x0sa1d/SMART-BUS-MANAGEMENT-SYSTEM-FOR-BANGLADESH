/** Road distance estimate between two lat/lng points (km) */
export function estimateRoadDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const straight = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(straight * 1.35);
}

export function estimateDurationMinutes(distanceKm: number, avgSpeedKmh = 45): number {
  return Math.round((distanceKm / avgSpeedKmh) * 60);
}

export function calculateFare(distanceKm: number): number {
  return Math.round(distanceKm * 3);
}

export const FARE_PER_KM_BDT = 3;
