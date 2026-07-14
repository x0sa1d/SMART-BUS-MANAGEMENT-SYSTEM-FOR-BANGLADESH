import { hashPassword } from "better-auth/crypto";
import type { Role } from "@prisma/client";
import { db } from "@/lib/db";

export type DemoAccount = {
  email: string;
  password: string;
  name: string;
  role: Role;
  companyId?: string | null;
};

export async function ensureCredentialUser(account: DemoAccount): Promise<string> {
  const email = account.email.trim().toLowerCase();
  const hashedPassword = await hashPassword(account.password);
  const existing = await db.user.findUnique({ where: { email } });

  if (existing) {
    await db.user.update({
      where: { id: existing.id },
      data: {
        name: account.name,
        role: account.role,
        companyId: account.companyId ?? null,
        emailVerified: true,
        deletedAt: null,
      },
    });

    const credential = await db.account.findFirst({
      where: { userId: existing.id, providerId: "credential" },
    });

    if (credential) {
      await db.account.update({
        where: { id: credential.id },
        data: { password: hashedPassword },
      });
    } else {
      await db.account.create({
        data: {
          id: crypto.randomUUID(),
          accountId: existing.id,
          providerId: "credential",
          userId: existing.id,
          password: hashedPassword,
        },
      });
    }

    return existing.id;
  }

  const userId = crypto.randomUUID();
  await db.user.create({
    data: {
      id: userId,
      name: account.name,
      email,
      emailVerified: true,
      role: account.role,
      companyId: account.companyId ?? null,
      accounts: {
        create: {
          id: crypto.randomUUID(),
          accountId: userId,
          providerId: "credential",
          password: hashedPassword,
        },
      },
    },
  });

  return userId;
}

export async function ensurePassengerProfile(
  userId: string,
  data: { fullName: string; email: string; phone: string }
) {
  const existing = await db.passenger.findFirst({ where: { userId } });
  if (existing) {
    await db.passenger.update({
      where: { id: existing.id },
      data: { fullName: data.fullName, email: data.email, phone: data.phone, deletedAt: null },
    });
    return existing.id;
  }

  const byEmail = await db.passenger.findFirst({
    where: { email: data.email, deletedAt: null },
  });
  if (byEmail) {
    await db.passenger.update({
      where: { id: byEmail.id },
      data: { userId, fullName: data.fullName, phone: data.phone, deletedAt: null },
    });
    return byEmail.id;
  }

  const created = await db.passenger.create({
    data: {
      userId,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
    },
  });
  return created.id;
}

export async function linkDriverProfile(
  userId: string,
  driverId: string,
  data?: { email?: string; fullName?: string }
) {
  await db.driver.update({
    where: { id: driverId },
    data: {
      userId,
      ...(data?.email ? { email: data.email } : {}),
      ...(data?.fullName ? { fullName: data.fullName } : {}),
      deletedAt: null,
    },
  });
}

export async function ensureDriverProfile(
  userId: string,
  data: { fullName: string; email: string; phone?: string; licenseNumber?: string }
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
      licenseNumber: data.licenseNumber ?? `DL-${userId.slice(0, 8).toUpperCase()}`,
      experience: 0,
    },
  });
  return created.id;
}

export async function seedDemoAccounts(driverId?: string) {
  const accounts: DemoAccount[] = [
    {
      email: "admin@smartbus.com",
      password: "Admin@12345",
      name: "Super Admin",
      role: "SUPER_ADMIN",
    },
    {
      email: "manager@smartbus.com",
      password: "Manager@12345",
      name: "Platform Admin",
      role: "MANAGER",
      companyId: null,
    },
    {
      email: "passenger@smartbus.com",
      password: "Passenger@12345",
      name: "Demo Passenger",
      role: "PASSENGER",
    },
    {
      email: "driver@smartbus.com",
      password: "Driver@12345",
      name: "Karim Ahmed",
      role: "DRIVER",
    },
  ];

  const ids: Record<string, string> = {};
  for (const account of accounts) {
    ids[account.email] = await ensureCredentialUser(account);
  }

  await ensurePassengerProfile(ids["passenger@smartbus.com"], {
    fullName: "Demo Passenger",
    email: "passenger@smartbus.com",
    phone: "+880 1711-000000",
  });

  if (driverId) {
    await linkDriverProfile(ids["driver@smartbus.com"], driverId, {
      email: "driver@smartbus.com",
      fullName: "Karim Ahmed",
    });
  } else {
    await ensureDriverProfile(ids["driver@smartbus.com"], {
      fullName: "Karim Ahmed",
      email: "driver@smartbus.com",
      phone: "+880 1711-111111",
      licenseNumber: "DL-DEMO-001",
    });
  }

  console.log("\n=== Demo Login Accounts ===");
  for (const account of accounts) {
    const label =
      account.role === "SUPER_ADMIN"
        ? "Super Admin"
        : account.role === "MANAGER"
          ? "Platform Admin"
          : account.role === "DRIVER"
            ? "Driver"
            : "Passenger";
    console.log(`${label}: ${account.email} / ${account.password}`);
  }
  console.log("===========================\n");

  return ids;
}
