import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public auth pages through
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/verify-email") ||
    pathname.startsWith("/verify-notice")
  ) {
    return NextResponse.next();
  }

  // Appwrite uses localStorage which edge middleware can't access.
  // Route protection is handled client-side by <AuthGuard />.

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/trip/:path*",
    "/planner/:path*",
    "/join-trip/:path*",
  ],
};
