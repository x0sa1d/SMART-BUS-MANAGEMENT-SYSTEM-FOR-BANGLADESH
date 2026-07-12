import { Prisma } from "@prisma/client";
import type { ActionResult } from "@/types";

export function serializePrisma<T>(data: T): T {
  if (data === null || data === undefined) return data;
  return JSON.parse(
    JSON.stringify(data, (_key, value) => {
      if (Prisma.Decimal.isDecimal(value)) return value.toNumber();
      return value;
    })
  ) as T;
}

export function success<T>(data: T): ActionResult<T> {
  return { success: true, data: serializePrisma(data) };
}

export function failure(error: string): ActionResult<never> {
  return { success: false, error };
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
}
