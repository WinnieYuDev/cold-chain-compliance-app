import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Route protection: redirect unauthenticated users from /dashboard to /login.
 * Auth state is in Convex (client token); dashboard layout also checks getMe and redirects.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  if (isDashboard) {
    // Convex Auth stores tokens in localStorage, so we can't verify auth here.
    // Dashboard layout uses getMe and redirects to /login if null.
    return NextResponse.next();
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
