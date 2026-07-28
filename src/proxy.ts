import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

function requestedPath(req: { nextUrl: { pathname: string; search: string } }) {
  return `${req.nextUrl.pathname}${req.nextUrl.search}`;
}

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;
  const isPhoneVerified = (req.auth?.user as any)?.isPhoneVerified;

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

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
