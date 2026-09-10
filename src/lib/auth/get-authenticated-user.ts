import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { UserRole } from "@/types/roles";

export interface AuthUserInfo {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  supabaseAuthId?: string | null;
  tenantProfileId?: string | null;
  unitAccountId?: string | null;
}

/**
 * Helper function to extract and verify the current authenticated user.
 * Supports NextRequest (in API routes) or next/headers cookies (in Server Components).
 */
export async function getAuthenticatedUser(request?: NextRequest): Promise<AuthUserInfo | null> {
  let authUserEmail: string | undefined;
  let authUserId: string | undefined;

  let accessTokenCookie: string | undefined;
  let refreshTokenCookie: string | undefined;
  let userEmailCookie: string | undefined;
  let sessionCookie: string | undefined;
  let demoRoleCookie: UserRole | undefined;

  if (request) {
    accessTokenCookie = request.cookies.get("arventa_access_token")?.value;
    refreshTokenCookie = request.cookies.get("arventa_refresh_token")?.value;
    userEmailCookie = request.cookies.get("arventa_user_email")?.value;
    sessionCookie = request.cookies.get("arventa_session")?.value;
    demoRoleCookie = request.cookies.get("arventa_demo_role")?.value as UserRole;
  } else {
    try {
      const cookieStore = await cookies();
      accessTokenCookie = cookieStore.get("arventa_access_token")?.value;
      refreshTokenCookie = cookieStore.get("arventa_refresh_token")?.value;
      userEmailCookie = cookieStore.get("arventa_user_email")?.value;
      sessionCookie = cookieStore.get("arventa_session")?.value;
      demoRoleCookie = cookieStore.get("arventa_demo_role")?.value as UserRole;
    } catch (err) {}
  }

  // 1. Check HttpOnly JWT Access Token / Refresh Token
  if (accessTokenCookie) {
    const jwtPayload = verifyJwt(accessTokenCookie);
    if (jwtPayload?.email) {
      authUserEmail = jwtPayload.email;
      authUserId = jwtPayload.userId;
    }
  }

  if (!authUserEmail && refreshTokenCookie) {
    const refreshPayload = verifyJwt(refreshTokenCookie);
    if (refreshPayload?.email) {
      authUserEmail = refreshPayload.email;
      authUserId = refreshPayload.userId;
    }
  }

  // 2. Check Supabase Auth server session
  if (!authUserEmail) {
    try {
      const supabase = await createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        authUserId = authUser.id;
        authUserEmail = authUser.email;
      }
    } catch (err) {}
  }

  // 3. Check client session userEmail cookie or demo session fallback
  if (!authUserEmail) {
    if (userEmailCookie) {
      authUserEmail = decodeURIComponent(userEmailCookie);
    } else if (sessionCookie === "true") {
      const activeDemoRole = demoRoleCookie || UserRole.OWNER;
      if (activeDemoRole === UserRole.PLATFORM_ADMIN) authUserEmail = "admin@arventa.id";
      else if (activeDemoRole === UserRole.HOUSEKEEPING) authUserEmail = "agus.hk@arventa.id";
      else if (activeDemoRole === UserRole.USER || activeDemoRole === UserRole.TENANT) authUserEmail = "apt12b01@arventa.id";
      else authUserEmail = "owner@arventa.id";
    }
  }

  if (!authUserEmail && !authUserId) {
    return null;
  }

  // Fetch DB User from Prisma
  const dbUser = await prisma.user.findFirst({
    where: {
      OR: [
        ...(authUserId ? [{ id: authUserId }, { supabaseAuthId: authUserId }] : []),
        ...(authUserEmail ? [{ email: authUserEmail }] : []),
      ],
    },
    include: {
      tenantProfile: true,
      unitAccount: true,
    },
  });

  if (!dbUser) {
    // Attempt fallback lookup for a real DB user by email or role
    const activeDemoRole = demoRoleCookie || UserRole.OWNER;
    const fallbackUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...(authUserEmail ? [{ email: authUserEmail }] : []),
          { role: activeDemoRole },
        ],
      },
      include: {
        tenantProfile: true,
        unitAccount: true,
      },
    });

    if (fallbackUser) {
      return {
        id: fallbackUser.id,
        email: fallbackUser.email,
        fullName: fallbackUser.fullName,
        role: fallbackUser.role as UserRole,
        supabaseAuthId: fallbackUser.supabaseAuthId,
        tenantProfileId: fallbackUser.tenantProfile?.id || null,
        unitAccountId: fallbackUser.unitAccount?.id || null,
      };
    }

    if (sessionCookie === "true") {
      return {
        id: "demo-user-id",
        email: authUserEmail || "owner@arventa.id",
        fullName: activeDemoRole === UserRole.OWNER ? "Bpk. Hendra Pratama" : activeDemoRole,
        role: activeDemoRole,
        supabaseAuthId: null,
        tenantProfileId: null,
        unitAccountId: null,
      };
    }
    return null;
  }

  return {
    id: dbUser.id,
    email: dbUser.email,
    fullName: dbUser.fullName,
    role: dbUser.role as UserRole,
    supabaseAuthId: dbUser.supabaseAuthId,
    tenantProfileId: dbUser.tenantProfile?.id || null,
    unitAccountId: dbUser.unitAccount?.id || null,
  };
}
