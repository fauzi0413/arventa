"use client";

import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// nuqs Adapter Provider for Next.js App Router
// ---------------------------------------------------------------------------
// Wraps the app so that `useQueryState()` and related hooks from nuqs
// can sync URL search params correctly with the App Router.
// ---------------------------------------------------------------------------

export function NuqsProvider({ children }: { children: ReactNode }) {
  return <NuqsAdapter>{children}</NuqsAdapter>;
}
