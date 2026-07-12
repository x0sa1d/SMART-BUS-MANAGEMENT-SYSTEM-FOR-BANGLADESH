import { db } from "@/lib/db";
import type { CompanyStatus } from "@prisma/client";
import { buildCompanyRegistry, TARGET_COMPANY_COUNT } from "../src/constants/company-registry";

export { REGISTERED_COMPANIES } from "../src/constants/company-registry";

export const MAJOR_OPERATORS = buildCompanyRegistry(24);

export async function seedBusCompanies(targetCount = TARGET_COMPANY_COUNT) {
  const districts = await db.district.findMany({ where: { deletedAt: null } });
  const names = buildCompanyRegistry(targetCount);
  const existingCompanies = await db.busCompany.findMany({
    where: { deletedAt: null },
    select: { name: true },
  });
  const existingNames = new Set(existingCompanies.map((c) => c.name));
  const toCreate = names.filter((name) => !existingNames.has(name));

  if (toCreate.length === 0) {
    console.log(`Bus companies already at ${existingCompanies.length} (target ${targetCount})`);
    return db.busCompany.findMany({ where: { deletedAt: null }, take: 5 });
  }

  const startIdx = existingCompanies.length;
  const batchSize = 50;

  for (let b = 0; b < toCreate.length; b += batchSize) {
    const batch = toCreate.slice(b, b + batchSize);
    await db.busCompany.createMany({
      data: batch.map((name, idx) => {
        const globalIdx = startIdx + b + idx;
        const district = districts[globalIdx % districts.length];
        const isMajor = globalIdx < MAJOR_OPERATORS.length;
        return {
          name,
          nameBn: name,
          code: `OP-${String(globalIdx + 1).padStart(4, "0")}`,
          phone: `+880 1${700 + (globalIdx % 900)}-${String(100000 + globalIdx).slice(0, 6)}`,
          email: `contact@${name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com.bd`,
          address: `${district?.name || "Dhaka"}, Bangladesh`,
          districtId: district?.id,
          status: (isMajor ? "ACTIVE" : globalIdx % 25 === 0 ? "PENDING" : "ACTIVE") as CompanyStatus,
          fleetSize: isMajor ? 80 + (globalIdx % 120) : 20 + (globalIdx % 80),
          rating: isMajor ? 4.2 + (globalIdx % 8) / 10 : 3.5 + (globalIdx % 15) / 10,
          isNational: isMajor,
          foundedYear: 1980 + (globalIdx % 40),
        };
      }),
      skipDuplicates: true,
    });
  }

  const companies = await db.busCompany.findMany({ where: { deletedAt: null } });
  console.log(`Seeded ${companies.length} bus companies (${toCreate.length} added)`);
  return companies;
}

export async function linkBusesAndDriversToCompanies() {
  const companies = await db.busCompany.findMany({
    where: { deletedAt: null, status: "ACTIVE" },
    orderBy: { isNational: "desc" },
  });
  if (companies.length === 0) return;

  const buses = await db.bus.findMany({ where: { deletedAt: null, companyId: null } });
  for (let i = 0; i < buses.length; i++) {
    await db.bus.update({
      where: { id: buses[i].id },
      data: { companyId: companies[i % companies.length].id },
    });
  }

  const drivers = await db.driver.findMany({ where: { deletedAt: null, companyId: null } });
  for (let i = 0; i < drivers.length; i++) {
    await db.driver.update({
      where: { id: drivers[i].id },
      data: { companyId: companies[i % companies.length].id },
    });
  }
}
