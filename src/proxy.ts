import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { verifyJwt, generateAuthTokens } from "@/lib/auth/jwt";

// ---------------------------------------------------------------------------
// Next.js 16 Proxy — Standard JWT Auth Gate & Silent Token Refresher
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
  const { pathname } = request.nextUrl;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  // 1. Allow maintenance page & static assets without redirect loops
  if (pathname.startsWith("/maintenance")) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // 2. JWT Verification & Silent Refresh Token Rotation (RTR)
  const accessTokenCookie = request.cookies.get("arventa_access_token")?.value;
  const refreshTokenCookie = request.cookies.get("arventa_refresh_token")?.value;
  const sessionCookie = request.cookies.get("arventa_session")?.value;
  const demoRoleCookie = request.cookies.get("arventa_demo_role")?.value;

  let authenticatedUser: { id: string; email: string; role: string } | null = null;
  let newRotatedTokens: { accessToken: string; refreshToken: string; expiresIn: number; refreshExpiresIn: number } | null = null;

  // A. Check Access Token
  if (accessTokenCookie) {
    const accessPayload = verifyJwt(accessTokenCookie);
    if (accessPayload && accessPayload.type === "access") {
      authenticatedUser = {
        id: accessPayload.userId,
        email: accessPayload.email,
        role: accessPayload.role,
      };
    }
  }

  // B. Silent Refresh: If access token is expired/missing but refresh token is valid
  if (!authenticatedUser && refreshTokenCookie) {
    const refreshPayload = verifyJwt(refreshTokenCookie);
    if (refreshPayload && refreshPayload.type === "refresh") {
      authenticatedUser = {
        id: refreshPayload.userId,
        email: refreshPayload.email,
        role: refreshPayload.role,
      };

      // Mint new token pair (Refresh Token Rotation)
      newRotatedTokens = generateAuthTokens({
        id: refreshPayload.userId,
        email: refreshPayload.email,
        role: refreshPayload.role,
      });
    }
  }

  // C. Fallback: Check Supabase session (with graceful stale cookie cleanup)
  let supabaseUser = null;
  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });

  if (!authenticatedUser) {
    const sessionResult = await updateSession(request);
    supabaseResponse = sessionResult.supabaseResponse;
    supabaseUser = sessionResult.user;
  }

  const isUserAuthenticated = Boolean(
    authenticatedUser ||
    supabaseUser ||
    sessionCookie === "true" ||
    Boolean(demoRoleCookie)
  );

  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isAuthPage = authRoutes.some((route) => pathname.startsWith(route));

  // 3. Redirect unauthenticated users away from protected routes
  if (!isUserAuthenticated && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const redirectResponse = NextResponse.redirect(url);

    // Clean up any stale/broken auth cookies
    redirectResponse.cookies.set("arventa_access_token", "", { path: "/", maxAge: 0 });
    redirectResponse.cookies.set("arventa_refresh_token", "", { path: "/", maxAge: 0 });
    redirectResponse.cookies.set("arventa_session", "", { path: "/", maxAge: 0 });
    redirectResponse.cookies.set("arventa_demo_role", "", { path: "/", maxAge: 0 });
    redirectResponse.cookies.set("arventa_user_email", "", { path: "/", maxAge: 0 });

    return redirectResponse;
  }

  // 4. Redirect authenticated users away from auth pages to their role-specific dashboard
  if (isUserAuthenticated && isAuthPage) {
    const userRole = authenticatedUser?.role;
    let target = "/owner/dashboard";
    if (userRole === "TENANT" || userRole === "USER") {
      target = "/portal/room";
    } else if (userRole === "HOUSEKEEPING") {
      target = "/housekeeping/room-grid";
    } else if (userRole === "PLATFORM_ADMIN" || userRole === "SUPER_ADMIN") {
      target = "/platform/dashboard";
    } else {
      target = "/";
    }

    const url = request.nextUrl.clone();
    url.pathname = target;
    return NextResponse.redirect(url);
  }

  // 5. Forward request and apply rotated tokens if refreshed
  const finalResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (newRotatedTokens) {
    const isProduction = process.env.NODE_ENV === "production";
    finalResponse.cookies.set("arventa_access_token", newRotatedTokens.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: newRotatedTokens.expiresIn,
    });
    finalResponse.cookies.set("arventa_refresh_token", newRotatedTokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: newRotatedTokens.refreshExpiresIn,
    });
  }

  return finalResponse;
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
