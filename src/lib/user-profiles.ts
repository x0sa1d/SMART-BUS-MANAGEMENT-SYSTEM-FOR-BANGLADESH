import { db } from "@/lib/db";

export async function ensureDriverProfileForUser(
  userId: string,
  data: { fullName: string; email: string; phone?: string }
) {
  const linked = await db.driver.findFirst({ where: { userId, deletedAt: null } });
  if (linked) return linked.id;

  const byEmail = await db.driver.findFirst({
    where: { email: data.email, deletedAt: null },
  });
  if (byEmail) {
    await db.driver.update({
      where: { id: byEmail.id },
      data: { userId, fullName: data.fullName, deletedAt: null },
    });
    return byEmail.id;
  }

  const created = await db.driver.create({
    data: {
      userId,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone ?? "+880 1700-000000",
      licenseNumber: `DL-${userId.slice(0, 8).toUpperCase()}`,
      experience: 0,
    },
  });
  return created.id;
}

export async function unlinkDriverProfile(userId: string) {
  const driver = await db.driver.findFirst({ where: { userId, deletedAt: null } });
  if (driver) {
    await db.driver.update({
      where: { id: driver.id },
      data: { userId: null },
    });
  }
}

export async function ensurePassengerProfileForUser(
  userId: string,
  data: { fullName: string; email: string; phone?: string }
) {
  const linked = await db.passenger.findFirst({ where: { userId } });
  if (linked) return linked.id;

  const created = await db.passenger.create({
    data: {
      userId,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone ?? "+880 1700-000000",
    },
  });
  return created.id;
}
