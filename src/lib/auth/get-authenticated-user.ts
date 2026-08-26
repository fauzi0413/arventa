import { NextRequest } from "next/server";
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
 * Helper function to extract and verify the current authenticated user from NextRequest.
 * Checks JWT Access Token, Refresh Token, Supabase Auth session, and userEmail cookie fallback.
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthUserInfo | null> {
  let authUserEmail: string | undefined;
  let authUserId: string | undefined;

  // 1. Check HttpOnly JWT Access Token / Refresh Token
  const accessTokenCookie = request.cookies.get("arventa_access_token")?.value;
  const refreshTokenCookie = request.cookies.get("arventa_refresh_token")?.value;

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

  // 3. Check client session userEmail cookie
  if (!authUserEmail) {
    const userEmailCookie = request.cookies.get("arventa_user_email")?.value;
    if (userEmailCookie) {
      authUserEmail = decodeURIComponent(userEmailCookie);
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
