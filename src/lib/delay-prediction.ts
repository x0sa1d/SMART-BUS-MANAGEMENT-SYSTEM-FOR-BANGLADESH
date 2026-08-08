import { estimateRoadDistanceKm, estimateDurationMinutes } from "@/lib/geo";

export type DelayPredictionInput = {
  tripDate: Date | string;
  departureTime: string; // "HH:mm"
  arrivalTime: string;
  estimatedDurationMinutes: number;
  distanceKm: number;
  status: string;
  startedAt?: Date | string | null;
  currentLat?: number | null;
  currentLng?: number | null;
  sourceLat?: number | null;
  sourceLng?: number | null;
  destLat?: number | null;
  destLng?: number | null;
  historicalAvgDelayMinutes?: number;
};

export type DelayPrediction = {
  predictedDelayMinutes: number;
  confidence: number; // 0-1
  riskLevel: "low" | "medium" | "high";
  eta: Date;
  reason: string;
  factors: string[];
};

function parseTimeOnDate(date: Date, time: string): Date {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(date);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

function rushHourPenalty(date: Date): { minutes: number; label?: string } {
  const hour = date.getHours();
  const day = date.getDay(); // 0 Sun
  let minutes = 0;
  const labels: string[] = [];

  if ((hour >= 7 && hour <= 10) || (hour >= 16 && hour <= 20)) {
    minutes += 18;
    labels.push("peak traffic hours");
  }
  if (day === 5) {
    minutes += 12;
    labels.push("Friday congestion");
  }
  if (day === 0 || day === 6) {
    minutes += 5;
    labels.push("weekend travel volume");
  }

  return { minutes, label: labels.join(", ") || undefined };
}

/**
 * Smart delay prediction using schedule progress, rush-hour heuristics,
 * remaining distance, and optional historical average.
 */
export function predictDelay(input: DelayPredictionInput): DelayPrediction {
  const tripDate = new Date(input.tripDate);
  const scheduledDeparture = parseTimeOnDate(tripDate, input.departureTime);
  const scheduledArrival = parseTimeOnDate(tripDate, input.arrivalTime);
  if (scheduledArrival <= scheduledDeparture) {
    scheduledArrival.setDate(scheduledArrival.getDate() + 1);
  }

  const factors: string[] = [];
  let delay = 0;

  const rush = rushHourPenalty(scheduledDeparture);
  if (rush.minutes > 0) {
    delay += rush.minutes;
    if (rush.label) factors.push(rush.label);
  }

  if (input.distanceKm > 250) {
    delay += 15;
    factors.push("long-haul route buffer");
  } else if (input.distanceKm > 120) {
    delay += 8;
    factors.push("intercity distance buffer");
  }

  if (input.historicalAvgDelayMinutes && input.historicalAvgDelayMinutes > 0) {
    delay += Math.round(input.historicalAvgDelayMinutes * 0.6);
    factors.push(`historical delay ~${Math.round(input.historicalAvgDelayMinutes)} min`);
  }

  const now = new Date();
  let confidence = 0.55;

  if (input.status === "DELAYED") {
    delay += 20;
    factors.push("trip already marked delayed");
    confidence += 0.15;
  }

  if (input.startedAt) {
    const started = new Date(input.startedAt);
    const lateStart = Math.max(0, Math.round((started.getTime() - scheduledDeparture.getTime()) / 60000));
    if (lateStart > 0) {
      delay += lateStart;
      factors.push(`departed ${lateStart} min late`);
      confidence += 0.1;
    }
  } else if (now > scheduledDeparture && ["SCHEDULED", "BOARDING"].includes(input.status)) {
    const waiting = Math.round((now.getTime() - scheduledDeparture.getTime()) / 60000);
    if (waiting > 0) {
      delay += Math.min(waiting, 90);
      factors.push(`waiting ${waiting} min past departure`);
      confidence += 0.12;
    }
  }

  // Progress-based ETA when GPS available
  if (
    input.currentLat != null &&
    input.currentLng != null &&
    input.destLat != null &&
    input.destLng != null
  ) {
    const remainingKm = estimateRoadDistanceKm(
      input.currentLat,
      input.currentLng,
      input.destLat,
      input.destLng
    );
    const remainingMin = estimateDurationMinutes(remainingKm, 42);
    const projectedArrival = new Date(now.getTime() + remainingMin * 60000);
    const gpsDelay = Math.max(
      0,
      Math.round((projectedArrival.getTime() - scheduledArrival.getTime()) / 60000)
    );
    delay = Math.round(delay * 0.35 + gpsDelay * 0.65);
    factors.push(`GPS remaining ~${remainingKm} km`);
    confidence += 0.2;
  }

  delay = Math.max(0, Math.min(180, Math.round(delay)));
  confidence = Math.min(0.95, Math.max(0.4, confidence));

  let riskLevel: DelayPrediction["riskLevel"] = "low";
  if (delay >= 30) riskLevel = "high";
  else if (delay >= 12) riskLevel = "medium";

  const eta = new Date(scheduledArrival.getTime() + delay * 60000);
  const reason =
    delay === 0
      ? "On-time outlook based on current conditions"
      : factors.slice(0, 2).join("; ") || "Traffic and schedule conditions";

  return {
    predictedDelayMinutes: delay,
    confidence,
    riskLevel,
    eta,
    reason,
    factors: factors.length ? factors : ["normal operating conditions"],
  };
}
