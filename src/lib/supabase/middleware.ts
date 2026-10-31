import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "./env";

/**
 * Refresh Supabase Auth cookies when present.
 * Does not gate routes — Better Auth owns application login.
 */
export async function updateSupabaseSession(request: NextRequest, response: NextResponse) {
  if (!isSupabaseConfigured()) return response;
  if (!request.cookies.getAll().some((cookie) => cookie.name.startsWith("sb-"))) {
    return response;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  let supabaseResponse = response;

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        response.cookies.getAll().forEach((cookie) => {
          supabaseResponse.cookies.set(cookie);
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
        Object.entries(headers).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value);
        });
      },
    },
  });

  await supabase.auth.getClaims();
  return supabaseResponse;
}
