import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Root Page — /
// ---------------------------------------------------------------------------
// Checks authentication status and redirects accordingly:
// - Authenticated → Dashboard (handled by (dashboard) route group)
// - Unauthenticated → /login (handled by proxy.ts)
//
// When the (dashboard)/page.tsx exists in the same route group, Next.js
// will render that page. This file acts as a fallback/redirect entry point.
// ---------------------------------------------------------------------------

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // If authenticated, the (dashboard) route group's page.tsx will render
  // since it matches the "/" path. This redirect is a safety net.
  redirect("/");
}
