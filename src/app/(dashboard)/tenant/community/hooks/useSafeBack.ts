"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

/**
 * useSafeBack
 * Provides safe back navigation that falls back to defaultHref
 * if there is no previous history entry.
 */
export function useSafeBack(defaultHref: string = "/tenant/community") {
  const router = useRouter();

  const handleBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(defaultHref);
    }
  }, [router, defaultHref]);

  return { handleBack };
}
