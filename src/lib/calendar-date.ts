/** Passenger-facing calendar dates use Bangladesh local time, not UTC. */
export const APP_TIMEZONE = "Asia/Dhaka";

export function calendarDateKey(date = new Date(), timeZone = APP_TIMEZONE): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function calendarTimeParts(
  date = new Date(),
  timeZone = APP_TIMEZONE
): { hours: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return {
    hours: Number(parts.find((part) => part.type === "hour")?.value ?? "0"),
    minutes: Number(parts.find((part) => part.type === "minute")?.value ?? "0"),
  };
}

export function addCalendarDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return next.toISOString().slice(0, 10);
}
