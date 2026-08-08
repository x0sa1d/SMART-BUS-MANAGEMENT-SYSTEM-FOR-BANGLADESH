import { Prisma, PrismaClient } from "@prisma/client";

const RETRYABLE_CODES = new Set(["P1001", "P1002", "P1008", "P1017", "P2024"]);

/** True only when DATABASE_URL looks like a real connection string. */
export function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL ?? "";
  if (!url.trim()) return false;
  if (
    url.includes("[YOUR-PASSWORD]") ||
    url.includes("YOUR_PASSWORD") ||
    url.includes("YOUR_DB_PASSWORD") ||
    url.includes("user:password@host") ||
    url.includes("://user:password@")
  ) {
    return false;
  }
  return url.startsWith("postgresql://") || url.startsWith("postgres://");
}

/**
 * Supabase pooler (and free-tier Postgres) cannot absorb Prisma's default
 * pool size (cpus*2+1). Keep a small client pool and longer wait.
 */
function withPrismaPoolParams(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", process.env.PRISMA_CONNECTION_LIMIT || "5");
    }
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", process.env.PRISMA_POOL_TIMEOUT || "20");
    }
    if (!url.searchParams.has("connect_timeout")) {
      url.searchParams.set("connect_timeout", "15");
    }
    return url.toString();
  } catch {
    return rawUrl;
  }
}

function isRetryableConnectionError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return RETRYABLE_CODES.has(error.code);
  }
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return false;
  }
  if (error instanceof Error) {
    const msg = error.message;
    if (
      msg.includes("Authentication failed") ||
      msg.includes("credentials") ||
      msg.includes("not valid") ||
      msg.includes("DATABASE_NOT_CONFIGURED")
    ) {
      return false;
    }
    return (
      msg.includes("Can't reach database server") ||
      msg.includes("Connection terminated") ||
      msg.includes("Timed out fetching a new connection") ||
      msg.includes("ECONNREFUSED")
    );
  }
  return false;
}

async function executeWithRetry<T>(operation: () => Promise<T>, maxAttempts = 3): Promise<T> {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_NOT_CONFIGURED");
  }

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isRetryableConnectionError(error) || attempt === maxAttempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
    }
  }
  throw lastError;
}

function createPrismaClient() {
  const datasourceUrl = withPrismaPoolParams(process.env.DATABASE_URL ?? "");
  const client = new PrismaClient({
    datasources: { db: { url: datasourceUrl } },
    log: [],
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
  prismaClientKey?: string;
};

function getTicketModelDmmfKey(): string {
  const ticket = Prisma.dmmf.datamodel.models.find((model) => model.name === "Ticket");
  if (!ticket) return "";
  return ticket.fields.map((field) => field.name).sort().join(",");
}

const prismaClientKey = [
  getTicketModelDmmfKey(),
  process.env.DATABASE_URL ?? "",
  process.env.PRISMA_CONNECTION_LIMIT || "5",
].join("|");

if (globalForPrisma.prisma && globalForPrisma.prismaClientKey !== prismaClientKey) {
  void globalForPrisma.prisma.$disconnect();
  globalForPrisma.prisma = undefined;
}

export const db = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
  globalForPrisma.prismaClientKey = prismaClientKey;
}

export function excludeDeleted<T extends { deletedAt?: Date | null }>(where: T = {} as T) {
  return { ...where, deletedAt: null };
}

export function isDatabaseAuthError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) return true;
  if (error instanceof Error) {
    return (
      error.message.includes("Authentication failed") ||
      error.message.includes("provided database credentials") ||
      error.message.includes("DATABASE_NOT_CONFIGURED") ||
      error.message.includes("[YOUR-PASSWORD]")
    );
  }
  return false;
}

export async function checkDatabaseConnection(): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;
  try {
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
