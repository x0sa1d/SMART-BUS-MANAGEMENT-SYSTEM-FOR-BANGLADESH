import type { Role } from "@prisma/client";
import { authClient } from "@/lib/auth-client";
import { getHomePathForUser } from "@/lib/redirect";
import { resolveUserHomePath } from "@/actions/auth.actions";

export type SignInUser = {
  id: string;
  email: string;
  name: string;
  role?: Role | string | null;
  companyId?: string | null;
};

export function safeNextPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

/** Resolve where to send the user after a successful sign-in. */
export async function resolvePostLoginPath(options: {
  next?: string | null;
  user?: SignInUser | null;
}): Promise<string> {
  const next = safeNextPath(options.next);
  if (next) return next;

  const user = options.user;
  if (user) {
    const role = (user.role as Role) || "PASSENGER";
    if (role !== "MANAGER" || !user.companyId) {
      return getHomePathForUser({ role, companyId: user.companyId });
    }
  }

  await authClient.getSession();
  return resolveUserHomePath();
}
