import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// ---------------------------------------------------------------------------
// Supabase Server Client
// ---------------------------------------------------------------------------
// Use this in Server Components, Server Actions, and Route Handlers.
// Creates a fresh client per request using the Next.js cookies() API.
// ---------------------------------------------------------------------------

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method is called from a Server Component where
            // cookies cannot be set. This is safe to ignore if you have
            // middleware (proxy) refreshing user sessions.
          }
        },
      },
    }
  );
}
