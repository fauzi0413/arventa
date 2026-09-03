"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

interface UseSafeBackOptions {
  fallbackUrl?: string;
  onFallback?: () => void;
}

/**
 * Safe fallback navigation hook.
 * Prevents blank screens or exiting the app if user arrives via direct link or has empty browser history.
 */
export function useSafeBack(options: UseSafeBackOptions = {}) {
  const router = useRouter();
  const { fallbackUrl = "/tenant/community-announcements", onFallback } = options;

  const safeBack = useCallback(() => {
    if (typeof window !== "undefined") {
      const hasHistory = window.history.length > 2;
      const isSameOrigin =
        document.referrer && document.referrer.startsWith(window.location.origin);

      if (hasHistory && isSameOrigin) {
        router.back();
      } else if (onFallback) {
        onFallback();
      } else {
        router.push(fallbackUrl);
      }
    } else {
      router.push(fallbackUrl);
    }
  }, [router, fallbackUrl, onFallback]);

  return { safeBack };
}
