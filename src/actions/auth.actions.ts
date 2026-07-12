"use server";

import { getSessionUserWithCompany } from "@/lib/auth-server";
import { getHomePathForUser } from "@/lib/redirect";

export async function resolveUserHomePath(): Promise<string> {
  const data = await getSessionUserWithCompany();
  if (!data) return "/login";
  const { user } = data;
  return getHomePathForUser({
    role: user.role,
    companyId: user.companyId,
    companyStatus: user.company?.status ?? null,
  });
}
