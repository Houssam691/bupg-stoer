import { NextRequest, NextResponse } from "next/server";

const ADMIN_COOKIE_NAME = "admin_auth";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow the admin login page and login API.
  if (pathname.startsWith("/admin/login") || pathname.startsWith("/api/admin/login")) {
    return NextResponse.next();
  }

  // Protect admin routes.
  if (pathname.startsWith("/admin")) {
    const isAuthed = req.cookies.get(ADMIN_COOKIE_NAME)?.value === "1";
    if (!isAuthed) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
