"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

// ---------------------------------------------------------------------------
// TanStack Query Provider
// ---------------------------------------------------------------------------
// Wraps the app with QueryClientProvider. Creates the QueryClient once
// per component lifecycle (via useState initializer) to avoid re-creating
// the client on every render in React 19 strict mode.
// ---------------------------------------------------------------------------

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
