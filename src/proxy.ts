import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// ---------------------------------------------------------------------------
// Next.js 16 Proxy — Auth Gate & Session Refresher
// ---------------------------------------------------------------------------
// In Next.js 16, middleware.ts is named proxy.ts.
// The exported function must be named `proxy`.
// ---------------------------------------------------------------------------

// Routes that require authentication (Dashboard & Management features)
const protectedPrefixes = [
  "/dashboard",
  "/admin",
  "/properties",
  "/units",
  "/unit",
  "/tenants",
  "/finance",
  "/operations",
  "/reports",
  "/portal",
  "/platform",
  "/owner",
  "/housekeeping",
  "/hk",
  "/tenant",
  "/invoices",
  "/expenses",
  "/announcements",
  "/settings",
  "/api-docs",
  "/api/docs",
];

// Auth routes (Login & Register)
const authRoutes = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // 1. Allow maintenance page & static assets without redirect loops
  if (pathname.startsWith("/maintenance")) {
    return supabaseResponse;
  }

  // 2. Redirect unauthenticated users away from protected dashboard routes
  const isProtected = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  const hasDemoSession =
    request.cookies.get("arventa_session")?.value === "true" ||
    Boolean(request.cookies.get("arventa_demo_role")?.value);

  if (!user && !hasDemoSession && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 3. Redirect authenticated users away from auth pages (/login, /register) to /dashboard
  if (user && authRoutes.some((route) => pathname.startsWith(route))) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
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
