"use server";

import { revalidateSystem } from "@/lib/revalidate-system";
import { db, excludeDeleted } from "@/lib/db";
import {
  requireScheduleAccess,
  assertBusInScope,
  getDashboardAccess,
} from "@/lib/auth-server";
import { companyScheduleFilter, companyBusFilter, companyDriverFilter } from "@/lib/access-scope";
import { success, failure, getErrorMessage } from "@/lib/action-utils";
import { scheduleSchema, tripDepartureSchema } from "@/schemas";
import { parseLocalDate } from "@/lib/utils";
import { calculateFare } from "@/lib/geo";

export async function getSchedulesForAccess() {
  const access = await getDashboardAccess();
  if (!access.canManageAllSchedules && !access.canManageCompanySchedules) {
    return [];
  }

  return db.schedule.findMany({
    where: companyScheduleFilter(access),
    include: {
      route: true,
      bus: { include: { company: { select: { id: true, name: true } } } },
      driver: true,
      trips: {
        where: { deletedAt: null, tripDate: { gte: new Date() } },
        orderBy: { tripDate: "asc" },
        take: 5,
      },
    },
    orderBy: { departureTime: "asc" },
  });
}

export async function getScheduleFormOptions() {
  const access = await requireScheduleAccess();

  const [routes, buses, drivers] = await Promise.all([
    db.route.findMany({ where: excludeDeleted(), orderBy: { name: "asc" } }),
    db.bus.findMany({
      where: companyBusFilter(access),
      select: { id: true, busNumber: true, companyId: true },
      orderBy: { busNumber: "asc" },
    }),
    db.driver.findMany({
      where: companyDriverFilter(access),
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    }),
  ]);

  return { routes, buses, drivers };
}

export async function createScheduleManaged(formData: FormData) {
  try {
    const access = await requireScheduleAccess();
    const raw = Object.fromEntries(formData);
    const daysOfWeek = formData.getAll("daysOfWeek") as string[];
    const parsed = scheduleSchema.safeParse({ ...raw, daysOfWeek });
    if (!parsed.success) return failure(parsed.error.errors[0].message);

    await assertBusInScope(parsed.data.busId, access);

    if (!access.canManageAllSchedules) {
      const driver = await db.driver.findFirst({
        where: { id: parsed.data.driverId, ...companyDriverFilter(access) },
      });
      if (!driver) return failure("Driver not in your company");
    }

    const schedule = await db.schedule.create({ data: parsed.data });
    revalidateSystem();
    return success(schedule);
  } catch (error) {
    return failure(getErrorMessage(error));
  }
}

export async function updateSchedule(scheduleId: string, formData: FormData) {
  try {
    const access = await requireScheduleAccess();
    const schedule = await db.schedule.findFirst({
      where: { id: scheduleId, ...companyScheduleFilter(access) },
    });
    if (!schedule) return failure("Schedule not found");

    const raw = Object.fromEntries(formData);
    const daysOfWeek = formData.getAll("daysOfWeek") as string[];
    const parsed = scheduleSchema.safeParse({ ...raw, daysOfWeek });
    if (!parsed.success) return failure(parsed.error.errors[0].message);

    await assertBusInScope(parsed.data.busId, access);

    const updated = await db.schedule.update({
      where: { id: scheduleId },
      data: parsed.data,
    });
    revalidateSystem();
    return success(updated);
  } catch (error) {
    return failure(getErrorMessage(error));
  }
}

export async function deleteSchedule(scheduleId: string) {
  try {
    const access = await requireScheduleAccess();
    const schedule = await db.schedule.findFirst({
      where: { id: scheduleId, ...companyScheduleFilter(access) },
    });
    if (!schedule) return failure("Schedule not found");

    await db.schedule.update({
      where: { id: scheduleId },
      data: { deletedAt: new Date(), isActive: false },
    });
    revalidateSystem();
    return success(null);
  } catch (error) {
    return failure(getErrorMessage(error));
  }
}

export async function createScheduledDeparture(formData: FormData) {
  try {
    const access = await requireScheduleAccess();
    const parsed = tripDepartureSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return failure(parsed.error.errors[0].message);

    const schedule = await db.schedule.findFirst({
      where: { id: parsed.data.scheduleId, ...companyScheduleFilter(access) },
      include: { route: true },
    });
    if (!schedule) return failure("Schedule not found");

    const tripDate = parseLocalDate(parsed.data.tripDate);

    if (parsed.data.departureTime || parsed.data.arrivalTime) {
      await db.schedule.update({
        where: { id: schedule.id },
        data: {
          ...(parsed.data.departureTime ? { departureTime: parsed.data.departureTime } : {}),
          ...(parsed.data.arrivalTime ? { arrivalTime: parsed.data.arrivalTime } : {}),
        },
      });
    }

    const existing = await db.trip.findFirst({
      where: { scheduleId: schedule.id, tripDate, deletedAt: null },
    });
    if (existing) return failure("A trip already exists for this date");

    const trip = await db.trip.create({
      data: {
        scheduleId: schedule.id,
        busId: schedule.busId,
        driverId: schedule.driverId,
        tripDate,
        status: "SCHEDULED",
      },
    });

    revalidateSystem();
    revalidateSystem();
    return success(trip);
  } catch (error) {
    return failure(getErrorMessage(error));
  }
}
