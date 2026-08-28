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

    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    user = supabaseUser;
  } catch (err) {
    console.warn("Supabase auth session refresh warning:", err);
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
