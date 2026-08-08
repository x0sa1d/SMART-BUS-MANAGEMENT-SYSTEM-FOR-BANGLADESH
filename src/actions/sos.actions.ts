"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth, requireManager, getSession } from "@/lib/auth-server";
import { getRoleFromUser } from "@/lib/permissions";
import { success, failure } from "@/lib/action-utils";

export async function triggerSosAlert(input: {
  tripId?: string;
  message?: string;
  latitude?: number;
  longitude?: number;
}) {
  try {
    const session = await requireAuth();
    const role = getRoleFromUser(session.user);

    let passengerId: string | undefined;
    let driverId: string | undefined;
    let reporterType: "PASSENGER" | "DRIVER" = "PASSENGER";

    if (role === "DRIVER") {
      const driver = await db.driver.findFirst({
        where: { userId: session.user.id, deletedAt: null },
      });
      if (!driver) return failure("Driver profile not found");
      driverId = driver.id;
      reporterType = "DRIVER";
    } else {
      const passenger = await db.passenger.findFirst({
        where: { userId: session.user.id, deletedAt: null },
      });
      if (!passenger) return failure("Passenger profile not found");
      passengerId = passenger.id;
      reporterType = "PASSENGER";
    }

    const alert = await db.sosAlert.create({
      data: {
        tripId: input.tripId || null,
        passengerId,
        driverId,
        reporterType,
        latitude: input.latitude,
        longitude: input.longitude,
        message: input.message?.trim() || "Emergency SOS triggered",
        status: "ACTIVE",
      },
    });

    // Notify platform admins
    const admins = await db.user.findMany({
      where: {
        deletedAt: null,
        role: { in: ["SUPER_ADMIN", "MANAGER"] },
        companyId: null,
      },
      take: 20,
    });

    if (admins.length > 0) {
      await db.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          title: "SOS Emergency Alert",
          message: `${reporterType} triggered SOS${input.tripId ? ` on trip ${input.tripId.slice(0, 8)}` : ""}. ${input.message || ""}`.trim(),
          type: "SOS_ALERT",
          channel: "PUSH",
        })),
      });
    }

    revalidatePath("/passenger");
    revalidatePath("/driver");
    revalidatePath("/dashboard/sos");
    return success({ id: alert.id, message: "SOS alert sent. Help is being notified." });
  } catch (e) {
    console.error(e);
    return failure("Failed to send SOS");
  }
}

export async function updateSosStatus(alertId: string, status: "ACKNOWLEDGED" | "RESOLVED" | "FALSE_ALARM") {
  try {
    await requireManager();
    await db.sosAlert.update({
      where: { id: alertId },
      data: {
        status,
        acknowledgedAt: status === "ACKNOWLEDGED" ? new Date() : undefined,
        resolvedAt: status === "RESOLVED" || status === "FALSE_ALARM" ? new Date() : undefined,
      },
    });
    revalidatePath("/dashboard/sos");
    return success({ message: "SOS status updated" });
  } catch (e) {
    console.error(e);
    return failure("Failed to update SOS");
  }
}

export async function getMyRecentSos() {
  const session = await getSession();
  if (!session) return [];

  const passenger = await db.passenger.findFirst({
    where: { userId: session.user.id, deletedAt: null },
  });
  const driver = await db.driver.findFirst({
    where: { userId: session.user.id, deletedAt: null },
  });

  const or: { passengerId?: string; driverId?: string }[] = [];
  if (passenger) or.push({ passengerId: passenger.id });
  if (driver) or.push({ driverId: driver.id });
  if (or.length === 0) return [];

  return db.sosAlert.findMany({
    where: { OR: or },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
}
