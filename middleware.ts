import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Kept in sync with AUTH_ROLE_COOKIE_KEY in utils/authRoleCookie.ts. Inlined
// here (rather than imported) so this edge-runtime module never pulls in the
// client-only cookie writer.
const AUTH_ROLE_COOKIE_KEY = "baiy_role";

// Server-side role-boundary enforcement for dashboard routes (AUTH-017).
//
// The active session lives in Web Storage (invisible to the server), so a
// non-httpOnly `baiy_role` cookie is mirrored from it on the client. Middleware
// reads that cookie and redirects before any wrong-role HTML is streamed, so a
// buyer can never even momentarily paint the distributor/OEM/engineer/admin UI.
//
// This mirrors the client guard in app/dashboard/layout.tsx exactly (strict
// role-segment equality) — the client guard remains as defense-in-depth for the
// window between hydration and the cookie being written on first login.

const KNOWN_ROLE_SEGMENTS = new Set([
  "buyer",
  "distributor",
  "oem",
  "engineer",
  "admin",
  "agent",
  "super_admin",
]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get(AUTH_ROLE_COOKIE_KEY)?.value;

  // No session role → not authenticated for any dashboard route.
  if (!role) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  // Bare /dashboard → the caller's own role home.
  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    const roleHome = request.nextUrl.clone();
    roleHome.pathname = `/dashboard/${role}`;
    return NextResponse.redirect(roleHome);
  }

  const routeSegment = pathname.split("/")[2] ?? "";

  // Attempting to access another known role's dashboard → access denied.
  if (KNOWN_ROLE_SEGMENTS.has(routeSegment) && routeSegment !== role) {
    const unauthorizedUrl = request.nextUrl.clone();
    unauthorizedUrl.pathname = "/unauthorized";
    return NextResponse.redirect(unauthorizedUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
