import { Prisma, PrismaClient } from "@prisma/client";

const CONNECTION_ERROR_CODES = new Set(["P1001", "P1002", "P1008", "P1017"]);

function isConnectionError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return CONNECTION_ERROR_CODES.has(error.code);
  }
  if (error instanceof Error) {
    return (
      error.message.includes("Can't reach database server") ||
      error.message.includes("Connection terminated") ||
      error.message.includes("ECONNREFUSED")
    );
  }
  return false;
}

async function executeWithRetry<T>(operation: () => Promise<T>, maxAttempts = 4): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isConnectionError(error) || attempt === maxAttempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, 750 * attempt));
    }
  }
  throw lastError;
}

function createPrismaClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
  return client.$extends({
    query: {
      $allOperations({ args, query }) {
        return executeWithRetry(() => query(args));
      },
    },
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
  prismaDmmfKey?: string;
};

function getTicketModelDmmfKey(): string {
  const ticket = Prisma.dmmf.datamodel.models.find((model) => model.name === "Ticket");
  if (!ticket) return "";
  return ticket.fields.map((field) => field.name).sort().join(",");
}

const ticketDmmfKey = getTicketModelDmmfKey();

if (globalForPrisma.prisma && globalForPrisma.prismaDmmfKey !== ticketDmmfKey) {
  void globalForPrisma.prisma.$disconnect();
  globalForPrisma.prisma = undefined;
}

export const db = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
  globalForPrisma.prismaDmmfKey = ticketDmmfKey;
}

export function excludeDeleted<T extends { deletedAt?: Date | null }>(where: T = {} as T) {
  return { ...where, deletedAt: null };
}

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
