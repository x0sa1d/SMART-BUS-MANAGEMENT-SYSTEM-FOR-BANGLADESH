"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth, requireManager, getSession } from "@/lib/auth-server";
import { success, failure } from "@/lib/action-utils";

const itemSchema = z.object({
  type: z.enum(["LOST", "FOUND"]),
  title: z.string().min(3).max(120),
  description: z.string().min(5).max(2000),
  category: z.string().optional(),
  location: z.string().optional(),
  tripId: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
});

export async function createLostFoundItem(formData: FormData) {
  try {
    const session = await requireAuth();
    const passenger = await db.passenger.findFirst({
      where: { userId: session.user.id, deletedAt: null },
    });

    const parsed = itemSchema.safeParse({
      type: formData.get("type"),
      title: formData.get("title"),
      description: formData.get("description"),
      category: formData.get("category") || undefined,
      location: formData.get("location") || undefined,
      tripId: formData.get("tripId") || undefined,
      contactPhone: formData.get("contactPhone") || undefined,
      contactEmail: formData.get("contactEmail") || undefined,
    });

    if (!parsed.success) {
      return failure(parsed.error.errors[0]?.message ?? "Invalid input");
    }

    const item = await db.lostFoundItem.create({
      data: {
        ...parsed.data,
        contactEmail: parsed.data.contactEmail || null,
        tripId: parsed.data.tripId || null,
        passengerId: passenger?.id,
      },
    });

    revalidatePath("/passenger/lost-found");
    revalidatePath("/dashboard/lost-found");
    return success({ id: item.id, message: "Report submitted" });
  } catch (e) {
    console.error(e);
    return failure("Failed to submit report");
  }
}

export async function listLostFoundItems(filters?: { type?: "LOST" | "FOUND"; status?: string }) {
  await requireAuth();
  return db.lostFoundItem.findMany({
    where: {
      deletedAt: null,
      ...(filters?.type ? { type: filters.type } : {}),
      ...(filters?.status ? { status: filters.status as never } : { status: { in: ["REPORTED", "CLAIMED"] } }),
    },
    include: {
      passenger: { select: { fullName: true, phone: true } },
      trip: { include: { schedule: { include: { route: true } }, bus: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function claimLostFoundItem(itemId: string) {
  try {
    const session = await requireAuth();
    const item = await db.lostFoundItem.findFirst({
      where: { id: itemId, deletedAt: null },
    });
    if (!item) return failure("Item not found");
    if (item.status !== "REPORTED" && item.status !== "CLAIMED") {
      return failure("Item is no longer available");
    }

    await db.lostFoundItem.update({
      where: { id: itemId },
      data: {
        status: "CLAIMED",
        claimedBy: session.user.name || session.user.email,
        claimedAt: new Date(),
      },
    });

    revalidatePath("/passenger/lost-found");
    revalidatePath("/dashboard/lost-found");
    return success({ message: "Claim registered. Contact the reporter to arrange pickup" });
  } catch (e) {
    console.error(e);
    return failure("Failed to claim item");
  }
}

export async function updateLostFoundStatus(
  itemId: string,
  status: "REPORTED" | "CLAIMED" | "RETURNED" | "CLOSED"
) {
  try {
    await requireManager();
    await db.lostFoundItem.update({
      where: { id: itemId },
      data: {
        status,
        returnedAt: status === "RETURNED" ? new Date() : undefined,
      },
    });
    revalidatePath("/dashboard/lost-found");
    return success({ message: "Status updated" });
  } catch (e) {
    console.error(e);
    return failure("Failed to update status");
  }
}

export async function getMyLostFoundItems() {
  const session = await getSession();
  if (!session) return [];
  const passenger = await db.passenger.findFirst({
    where: { userId: session.user.id, deletedAt: null },
  });
  if (!passenger) return [];

  return db.lostFoundItem.findMany({
    where: { passengerId: passenger.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
}
