"use server";

import { revalidateSystem } from "@/lib/revalidate-system";
import { db, excludeDeleted } from "@/lib/db";
import { requireWriteAccess, getDashboardAccess } from "@/lib/auth-server";
import { companyBusFilter } from "@/lib/access-scope";
import { success, failure, getErrorMessage } from "@/lib/action-utils";
import { busSchema } from "@/schemas";
import { generateSeatLayout } from "@/lib/utils";

export async function getBuses() {
  const access = await getDashboardAccess();
  return db.bus.findMany({
    where: companyBusFilter(access),
    include: { driver: true, company: { select: { name: true } }, _count: { select: { seats: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getBusById(id: string) {
  return db.bus.findFirst({
    where: { id, deletedAt: null },
    include: { driver: true, seats: { where: excludeDeleted(), orderBy: [{ row: "asc" }, { column: "asc" }] } },
  });
}

export async function createBus(formData: FormData) {
  try {
    const access = await requireWriteAccess();
    const parsed = busSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return failure(parsed.error.errors[0].message);

    const { driverId, ...data } = parsed.data;
    const bus = await db.bus.create({
      data: {
        ...data,
        driverId: driverId || null,
        ...(access.companyId ? { companyId: access.companyId } : {}),
      },
    });

    const seatLayout = generateSeatLayout(data.capacity);
    await db.seat.createMany({
      data: seatLayout.map((s) => ({
        busId: bus.id,
        seatNumber: s.seatNumber,
        row: s.row,
        column: s.column,
        seatType: s.column <= 2 ? "REGULAR" : s.column === 3 ? "PREMIUM" : "VIP",
      })),
    });

    revalidateSystem();
    return success(bus);
  } catch (error) {
    return failure(getErrorMessage(error));
  }
}

export async function updateBus(id: string, formData: FormData) {
  try {
    const access = await requireWriteAccess();
    const bus = await db.bus.findFirst({ where: { id, ...companyBusFilter(access) } });
    if (!bus) return failure("Bus not found");
    const parsed = busSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return failure(parsed.error.errors[0].message);

    const { driverId, ...data } = parsed.data;
    const updated = await db.bus.update({
      where: { id },
      data: { ...data, driverId: driverId || null },
    });
    revalidateSystem();
    return success(updated);
  } catch (error) {
    return failure(getErrorMessage(error));
  }
}

export async function deleteBus(id: string) {
  try {
    const access = await requireWriteAccess();
    const bus = await db.bus.findFirst({ where: { id, ...companyBusFilter(access) } });
    if (!bus) return failure("Bus not found");
    await db.bus.update({ where: { id }, data: { deletedAt: new Date() } });
    revalidateSystem();
    return success(null);
  } catch (error) {
    return failure(getErrorMessage(error));
  }
}
