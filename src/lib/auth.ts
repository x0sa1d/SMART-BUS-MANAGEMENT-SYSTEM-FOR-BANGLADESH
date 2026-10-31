import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { db } from "./db";

function isLocalhostUrl(url: string) {
  return url.includes("localhost") || url.includes("127.0.0.1");
}

function resolveAppUrl() {
  const fromEnv = (process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "").trim();
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "";
  if (process.env.VERCEL_ENV && fromEnv && isLocalhostUrl(fromEnv) && vercelUrl) {
    return vercelUrl;
  }
  return fromEnv || vercelUrl || "http://localhost:3000";
}

const appUrl = resolveAppUrl();

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: appUrl,
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    sendResetPassword: async ({ user, url }) => {
      if (process.env.NODE_ENV === "development") {
        console.log(`[password-reset] ${user.email}: ${url}`);
      }
      // Wire an email provider here for production (Resend, SendGrid, etc.)
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "PASSENGER",
        input: false,
      },
      companyId: {
        type: "string",
        required: false,
        input: false,
      },
      username: {
        type: "string",
        required: false,
        input: false,
      },
      phone: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },
  trustedOrigins: [
    appUrl,
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
    "https://bus-ebon-nine.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ].filter((origin, index, list) => origin && list.indexOf(origin) === index),
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-in/email" && ctx.path !== "/sign-up/email") return;

      const email = typeof ctx.body?.email === "string" ? ctx.body.email.trim().toLowerCase() : null;
      if (!email) return;

      const user = await db.user.findUnique({ where: { email } });
      if (user?.deletedAt) {
        throw new APIError("FORBIDDEN", {
          message: "This account has been disabled. Contact support.",
        });
      }
    }),
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
