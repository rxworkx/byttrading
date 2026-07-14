import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/subscriptions",
  "/trading",
  "/fund-account",
  "/wallet",
  "/transactions",
  "/transparency",
  "/referral",
  "/bonus",
  "/notifications",
  "/profile",
  "/security",
  "/kyc",
  "/welcome",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isProtected && !request.cookies.get("access_token")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/subscriptions/:path*",
    "/trading/:path*",
    "/fund-account/:path*",
    "/wallet/:path*",
    "/transactions/:path*",
    "/transparency/:path*",
    "/referral/:path*",
    "/bonus/:path*",
    "/notifications/:path*",
    "/profile/:path*",
    "/security/:path*",
    "/kyc/:path*",
    "/welcome/:path*",
  ],
};
