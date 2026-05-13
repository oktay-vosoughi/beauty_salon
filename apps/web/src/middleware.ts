import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/hesabim") && !request.cookies.get("connect.sid")) {
    const url = request.nextUrl.clone();
    url.pathname = "/giris";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();
  // Forward the current pathname so server layouts can read it without
  // requiring a client-side hook.
  response.headers.set("x-pathname", request.nextUrl.pathname);
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/hesabim/:path*"],
};
