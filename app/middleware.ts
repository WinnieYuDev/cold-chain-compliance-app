import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Optional: enforce role for admin routes.
 * For demo, we allow all; role-based visibility is done in the dashboard UI.
 */
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
