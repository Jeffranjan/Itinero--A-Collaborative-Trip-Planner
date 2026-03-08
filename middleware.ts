import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Explicitly bypass auth guard for login and verification pages
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/verify-email") ||
    pathname.startsWith("/verify-notice")
  ) {
    return NextResponse.next();
  }

  // Auth validation via middleware is disabled for localhost
  // because Appwrite uses localStorage which edge middleware cannot read.
  // We now rely solely on a client-side <AuthGuard /> for route protection.

  // 4. Session exists, allow request to proceed (Client-side useAuth will handle email verification check)
  return NextResponse.next();
}

// Config matcher protects specific routes
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/trip/:path*",
    "/planner/:path*",
    "/join-trip/:path*",
  ],
};
