import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { HOME_PATH_COOKIE } from "@/lib/redirect";
import { updateSupabaseSession } from "@/lib/supabase/middleware";

const publicRoutes = ["/", "/start", "/login", "/register", "/register-company", "/forgot-password", "/reset-password", "/unauthorized", "/search", "/operators"];
const authRoutes = ["/login", "/register", "/register-company", "/forgot-password", "/reset-password"];
const allowedHomePaths = ["/dashboard", "/driver", "/passenger", "/company"];

function safeNextPath(next: string | null): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith("/api/")
  );
  const isAuthRoute = authRoutes.some((route) => pathname === route);

  let response = NextResponse.next({ request });

  if (sessionToken && isAuthRoute) {
    const nextParam = safeNextPath(request.nextUrl.searchParams.get("next"));
    if (nextParam) {
      response = NextResponse.redirect(new URL(nextParam, request.url));
    } else {
      const homeCookie = request.cookies.get(HOME_PATH_COOKIE)?.value;
      const home = homeCookie ? decodeURIComponent(homeCookie) : null;
      if (home && allowedHomePaths.some((p) => home === p || home.startsWith(`${p}/`))) {
        response = NextResponse.redirect(new URL(home, request.url));
      } else {
        response = NextResponse.redirect(new URL("/start", request.url));
      }
    }
  } else if (!sessionToken && !isPublicRoute && !pathname.startsWith("/api/")) {
    const loginUrl = new URL("/login", request.url);
    const returnPath = `${pathname}${request.nextUrl.search}`;
    if (returnPath !== "/login") {
      loginUrl.searchParams.set("next", returnPath);
    }
    response = NextResponse.redirect(loginUrl);
  }

  return updateSupabaseSession(request, response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
