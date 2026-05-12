import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  // Forward the current pathname so server layouts can read it without
  // requiring a client-side hook.
  response.headers.set("x-pathname", request.nextUrl.pathname);
  return response;
}

export const config = {
  // Apply only to admin routes to keep overhead minimal.
  matcher: ["/admin/:path*"],
};
