import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const ADMIN_ROUTES = [
  "/dashboard/about-slides",
  "/dashboard/metrics",
  "/dashboard/gallery",
  "/dashboard/contacts",
  "/dashboard/users",
  "/dashboard/queries",
];

function requestedPath(req: { nextUrl: { pathname: string; search: string } }) {
  return `${req.nextUrl.pathname}${req.nextUrl.search}`;
}

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;
  const isPhoneVerified = (req.auth?.user as any)?.isPhoneVerified;
  const userId = req.auth?.user?.id;
  const tokenSessionVersion = (req.auth?.user as any)?.sessionVersion;

  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");

  if (!isLoggedIn) {
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/verify-phone")) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", requestedPath(req));
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (role === "USER" && !isPhoneVerified && !pathname.startsWith("/verify-phone")) {
    return NextResponse.redirect(new URL("/verify-phone", req.url));
  }

  if (pathname.startsWith("/dashboard") && userId) {
    const user = await db
      .select({ isActive: users.isActive, sessionVersion: users.sessionVersion })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length > 0) {
      if (!user[0].isActive) {
        const response = NextResponse.redirect(new URL("/", req.url));
        response.cookies.delete("next-auth.session-token");
        response.cookies.delete("__Secure-next-auth.session-token");
        return response;
      }

      if (tokenSessionVersion !== undefined && user[0].sessionVersion !== tokenSessionVersion) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("reason", "session_expired");
        return NextResponse.redirect(loginUrl);
      }
    }

    const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));
    if (isAdminRoute && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/not-authorized", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
