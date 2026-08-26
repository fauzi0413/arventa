import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { signJwt } from "@/lib/auth/jwt";

/**
 * GET /auth/callback
 * Handles OAuth callback code exchange for Supabase Auth (e.g. Google Sign-In),
 * syncs user with Prisma DB, and sets HttpOnly JWT session cookies.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error && data.user) {
        const authUser = data.user;
        const email = authUser.email?.toLowerCase();

        if (email) {
          // Check or create user in Prisma DB
          let user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) {
            user = await prisma.user.create({
              data: {
                email,
                fullName:
                  authUser.user_metadata?.full_name ||
                  authUser.user_metadata?.name ||
                  email.split("@")[0],
                avatarUrl:
                  authUser.user_metadata?.avatar_url ||
                  authUser.user_metadata?.picture ||
                  null,
                role: "OWNER",
                isActive: true,
                supabaseAuthId: authUser.id,
              },
            });
          } else if (!user.supabaseAuthId) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { supabaseAuthId: authUser.id, isActive: true },
            });
          }

          // Generate Access & Refresh Tokens
          const accessToken = signJwt(
            { userId: user.id, email: user.email, role: user.role, type: "access" },
            15 * 60
          );
          const refreshToken = signJwt(
            { userId: user.id, email: user.email, role: user.role, type: "refresh" },
            7 * 24 * 60 * 60
          );

          let destination = "/owner/dashboard";
          if (user.role === "TENANT" || user.role === "USER") {
            destination = "/portal/room";
          } else if (user.role === "HOUSEKEEPING") {
            destination = "/housekeeping/room-grid";
          } else if ((user.role as string) === "PLATFORM_ADMIN" || (user.role as string) === "SUPER_ADMIN") {
            destination = "/platform/dashboard";
          }

          const response = NextResponse.redirect(`${origin}${destination}`);
          const isProduction = process.env.NODE_ENV === "production";

          response.cookies.set("arventa_access_token", accessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: "lax",
            path: "/",
            maxAge: 15 * 60,
          });
          response.cookies.set("arventa_refresh_token", refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: "lax",
            path: "/",
            maxAge: 7 * 24 * 60 * 60,
          });
          response.cookies.set("arventa_session", "true", { path: "/", sameSite: "lax" });
          response.cookies.set("arventa_demo_role", user.role, { path: "/", sameSite: "lax" });
          response.cookies.set("arventa_user_email", encodeURIComponent(user.email), {
            path: "/",
            sameSite: "lax",
          });

          return response;
        }
      }
    } catch (err) {
      console.error("Error exchanging OAuth code:", err);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Gagal melakukan autentikasi dengan Google`);
}
