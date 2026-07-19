import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

function requestedPath(req: { nextUrl: { pathname: string; search: string } }) {
  return `${req.nextUrl.pathname}${req.nextUrl.search}`;
}

function safeRedirectPath(value: string | null) {
  if (!value || value === "/login") return "/dashboard";
  if (!value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");

  // If targeting dashboard but not logged in, redirect to login
  if (!isLoggedIn && pathname.startsWith("/dashboard")) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", requestedPath(req));
    return NextResponse.redirect(loginUrl);
  }

  // If logged in and hitting an auth route, redirect to dashboard
  if (isLoggedIn && isAuthRoute) {
    const redirect = safeRedirectPath(req.nextUrl.searchParams.get("redirect"));
    return NextResponse.redirect(new URL(redirect, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
