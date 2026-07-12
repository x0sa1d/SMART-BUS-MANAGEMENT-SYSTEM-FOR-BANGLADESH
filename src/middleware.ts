import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { HOME_PATH_COOKIE } from "@/lib/redirect";

const publicRoutes = ["/", "/start", "/login", "/register", "/register-company", "/forgot-password", "/reset-password", "/unauthorized", "/search", "/operators"];
const authRoutes = ["/login", "/register", "/register-company", "/forgot-password", "/reset-password"];
const allowedHomePaths = ["/dashboard", "/driver", "/passenger", "/company"];

function safeNextPath(next: string | null): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith("/api/")
  );
  const isAuthRoute = authRoutes.some((route) => pathname === route);

  if (sessionToken && isAuthRoute) {
    const nextParam = safeNextPath(request.nextUrl.searchParams.get("next"));
    if (nextParam) {
      return NextResponse.redirect(new URL(nextParam, request.url));
    }

    const homeCookie = request.cookies.get(HOME_PATH_COOKIE)?.value;
    const home = homeCookie ? decodeURIComponent(homeCookie) : null;
    if (home && allowedHomePaths.some((p) => home === p || home.startsWith(`${p}/`))) {
      return NextResponse.redirect(new URL(home, request.url));
    }
    return NextResponse.redirect(new URL("/start", request.url));
  }

  if (!sessionToken && !isPublicRoute && !pathname.startsWith("/api/")) {
    const loginUrl = new URL("/login", request.url);
    const returnPath = `${pathname}${request.nextUrl.search}`;
    if (returnPath !== "/login") {
      loginUrl.searchParams.set("next", returnPath);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
