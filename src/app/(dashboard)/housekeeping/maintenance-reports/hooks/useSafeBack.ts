'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export function useSafeBack(fallbackPath = '/housekeeping/maintenance-reports') {
  const router = useRouter();

  const goBack = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 2) {
      router.back();
    } else {
      router.push(fallbackPath);
    }
  }, [router, fallbackPath]);

  return goBack;
}
