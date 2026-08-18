'use client';

import { useRouter } from 'next/navigation';

export function useSafeBack(fallbackPath: string = '/dashboard') {
  const router = useRouter();

  const handleSafeBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 2) {
      router.back();
    } else {
      router.push(fallbackPath);
    }
  };

  return handleSafeBack;
}
