import { NextRequest, NextResponse } from "next/server";
import { decodeToken } from "@/lib/session";

const COOKIE_NAME = "wp_token";

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const user = token ? decodeToken(token) : null;

  // ── Agency routes ────────────────────────────────────────────────────────
  if (pathname.startsWith("/agency") && !pathname.startsWith("/agency/login") && !pathname.startsWith("/agency/register")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/agency/login";
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    if (user.actorKind !== "agency") {
      return NextResponse.redirect(
        new URL(`/${user.actorKind}/dashboard`, request.url)
      );
    }
  }

  // ── Operator routes ──────────────────────────────────────────────────────
  if (pathname.startsWith("/operator") && !pathname.startsWith("/operator/login")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/operator/login";
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    if (user.actorKind !== "operator") {
      return NextResponse.redirect(
        new URL(`/${user.actorKind}/dashboard`, request.url)
      );
    }
  }

  // ── Admin routes ─────────────────────────────────────────────────────────
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    if (user.actorKind !== "admin") {
      return NextResponse.redirect(
        new URL(`/${user.actorKind}/dashboard`, request.url)
      );
    }
  }

  // ── Redirect authenticated users away from login pages ──────────────────
  if (user) {
    if (
      pathname === "/agency/login" ||
      pathname === "/agency/register"
    ) {
      return NextResponse.redirect(
        new URL("/agency/dashboard", request.url)
      );
    }
    if (pathname === "/operator/login") {
      return NextResponse.redirect(
        new URL("/operator/dashboard", request.url)
      );
    }
    if (pathname === "/admin/login") {
      return NextResponse.redirect(
        new URL("/admin/dashboard", request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
