"use client";

import { createBrowserClient } from "@supabase/ssr";

// ---------------------------------------------------------------------------
// Supabase Browser Client
// ---------------------------------------------------------------------------
// Use this in Client Components. It reads tokens from browser cookies that
// were written by the proxy (session refresher).
// ---------------------------------------------------------------------------

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
