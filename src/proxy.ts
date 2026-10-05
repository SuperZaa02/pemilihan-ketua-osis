import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "admin_session";

/**
 * Route protection di edge: halaman /admin/* (kecuali /admin/login)
 * hanya bisa diakses dengan session cookie.
 * Verifikasi tanda tangan tetap dilakukan ulang di server (requireAdmin).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/admin/login" && hasSessionCookie) {
    // Sudah login: tidak perlu melihat halaman login lagi.
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  if (
    pathname.startsWith("/admin")
    && pathname !== "/admin/login"
    && !hasSessionCookie
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
