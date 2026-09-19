import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Supabase Middleware Helper — for Next.js 16 proxy.ts
// ---------------------------------------------------------------------------
// Refreshes the auth session on every request and writes updated cookies
// back to the response so the browser stays in sync.
// ---------------------------------------------------------------------------

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  let user = null;

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key",
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Check if any supabase auth cookie is present before attempting getUser()
    const allCookies = request.cookies.getAll();
    const hasSupabaseCookie = allCookies.some((c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"));

    if (hasSupabaseCookie) {
      const {
        data: { user: supabaseUser },
        error: getUserError,
      } = await supabase.auth.getUser();

      if (getUserError) {
        // If the refresh token was not found or is invalid, clean up stale cookies silently
        if (
          getUserError.message?.includes("Refresh Token Not Found") ||
          (getUserError as any).code === "refresh_token_not_found" ||
          getUserError.status === 400
        ) {
          allCookies
            .filter((c) => c.name.startsWith("sb-"))
            .forEach((c) => {
              request.cookies.delete(c.name);
              supabaseResponse.cookies.delete(c.name);
            });
        }
      } else {
        user = supabaseUser;
      }
    }
  } catch (err: any) {
    // Suppress console spam for expected refresh token expiry
    if (!err?.message?.includes("Refresh Token Not Found") && err?.code !== "refresh_token_not_found") {
      console.warn("Supabase auth session refresh warning:", err?.message || err);
    }
  }

  // Fallback check for demo / local session cookie
  if (!user) {
    const sessionCookie = request.cookies.get("arventa_session")?.value;
    const demoRole = request.cookies.get("arventa_demo_role")?.value || "OWNER";

    if (sessionCookie === "true") {
      user = {
        id: "demo-user-id",
        email: `demo.${demoRole.toLowerCase()}@arventa.id`,
        user_metadata: { role: demoRole },
        app_metadata: { role: demoRole },
        role: "authenticated",
        aud: "authenticated",
        created_at: new Date().toISOString(),
      } as any;
    }
  }

  return { supabaseResponse, user };
}
