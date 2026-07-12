import { createAuthClient } from "better-auth/react";

function getAuthBaseURL() {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000";
}

export const authClient = createAuthClient({
  baseURL: getAuthBaseURL(),
});

export const { signIn, signUp, signOut, useSession } = authClient;

export const googleOAuthEnabled =
  typeof process !== "undefined" &&
  !!(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID);
