import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// ---------------------------------------------------------------------------
// Next.js 16 Proxy — Auth Gate & Session Refresher
// ---------------------------------------------------------------------------
// In Next.js 16, middleware.ts has been renamed to proxy.ts.
// The exported function must be named `proxy` (not `middleware`).
// ---------------------------------------------------------------------------

// Routes that require authentication
const protectedPrefixes = [
  "/properties",
  "/tenants",
  "/finance",
  "/operations",
  "/reports",
  "/portal",
  "/platform",
  "/owner",
  "/housekeeping",
];

// Routes only for unauthenticated users
const authRoutes = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Redirect unauthenticated users away from protected routes
  const isProtected =
    pathname === "/" ||
    protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (user && authRoutes.some((route) => pathname.startsWith(route))) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets (images, svgs, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
