"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  TenantAnnouncementItem,
  CommunityFilterState,
  TenantCommunityMeta,
} from "../types";

const LOCAL_STORAGE_KEY = "arventa_tenant_read_announcements";

export function useTenantCommunity(filter: CommunityFilterState) {
  const [announcements, setAnnouncements] = useState<TenantAnnouncementItem[]>([]);
  const [meta, setMeta] = useState<TenantCommunityMeta | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [hasNewAnnouncements, setHasNewAnnouncements] = useState<boolean>(false);

  // Track read IDs from localStorage
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return new Set(parsed);
      }
    } catch {
      // Ignore storage read errors
    }
    return new Set();
  });

  // Keep a ref of known IDs to detect new items in background sync
  const knownIdsRef = useRef<Set<string>>(new Set());

  // Save readIds to localStorage
  const persistReadIds = useCallback((newReadIds: Set<string>) => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(
          LOCAL_STORAGE_KEY,
          JSON.stringify(Array.from(newReadIds))
        );
      }
    } catch {
      // Ignore storage write errors
    }
  }, []);

  // Fetch announcements without throwing unhandled exceptions
  const fetchAnnouncements = useCallback(
    async (isBackground: boolean = false) => {
      if (!isBackground) {
        setIsLoading((prev) => (announcements.length === 0 ? true : prev));
        setIsRefreshing(true);
      }

      try {
        const queryParams = new URLSearchParams();
        queryParams.set("tab", filter.activeTab);
        if (filter.searchQuery?.trim()) {
          queryParams.set("search", filter.searchQuery.trim());
        }

        const res = await fetch(
          `/api/tenant/announcements?${queryParams.toString()}`,
          {
            cache: "no-store",
          }
        );

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          const errMsg =
            errJson?.message ||
            `Gagal memuat pengumuman (status: ${res.status})`;
          // Do not throw unhandled error - set error state gracefully
          if (!isBackground) {
            setError(errMsg);
          }
          return;
        }

        const json = await res.json();
        const rawItems: any[] = Array.isArray(json.data) ? json.data : [];

        // Map to standard TenantAnnouncementItem
        const items: TenantAnnouncementItem[] = rawItems.map((item) => {
          const isRead = readIds.has(item.id);
          const isImportant =
            typeof item.isImportant === "boolean"
              ? item.isImportant
              : item.priority === "IMPORTANT" ||
                Boolean(
                  item.title?.toLowerCase().includes("penting") ||
                    item.title?.toLowerCase().includes("urgent")
                );

          const scopeLabel =
            item.targetScopeLabel ||
            item.propertyInfo?.scopeLabel ||
            "Seluruh Penghuni";

          return {
            id: item.id,
            title: item.title,
            content: item.content,
            senderName: item.senderName,
            senderRole: item.senderRole || "OWNER",
            publishDate: item.publishDate,
            isImportant,
            targetScopeLabel: scopeLabel,
            isRead,
            propertyInfo: item.propertyInfo,
          };
        });

        // Detect new announcements if background sync and already loaded
        if (isBackground && knownIdsRef.current.size > 0) {
          const hasNew = items.some(
            (item) => !knownIdsRef.current.has(item.id)
          );
          if (hasNew) {
            setHasNewAnnouncements(true);
          }
        }

        // Update known IDs
        items.forEach((item) => knownIdsRef.current.add(item.id));

        setAnnouncements(items);
        setMeta(json.meta || null);
        setError(null);
        setLastSyncedAt(new Date());
      } catch (err: any) {
        // Network or fetch failure: keep stale data and log gently
        if (!isBackground) {
          setError(
            err?.message || "Tidak dapat terhubung ke server pengumuman."
          );
        }
      } finally {
        if (!isBackground) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [filter.activeTab, filter.searchQuery, readIds, announcements.length]
  );

  // Initial fetch and on filter changes
  useEffect(() => {
    fetchAnnouncements(false);
  }, [fetchAnnouncements]);

  // Realtime Polling (every 20s)
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && !document.hidden) {
        fetchAnnouncements(true);
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [fetchAnnouncements]);

  // Window Focus Revalidation
  useEffect(() => {
    const handleFocus = () => {
      fetchAnnouncements(true);
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [fetchAnnouncements]);

  // Mark single announcement as read
  const markAsRead = useCallback(
    (id: string) => {
      setReadIds((prev) => {
        if (prev.has(id)) return prev;
        const next = new Set(prev);
        next.add(id);
        persistReadIds(next);
        return next;
      });

      setAnnouncements((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
      );
    },
    [persistReadIds]
  );

  // Mark all currently loaded announcements as read
  const markAllAsRead = useCallback(() => {
    setReadIds((prev) => {
      const next = new Set(prev);
      announcements.forEach((a) => next.add(a.id));
      persistReadIds(next);
      return next;
    });

    setAnnouncements((prev) => prev.map((item) => ({ ...item, isRead: true })));
  }, [announcements, persistReadIds]);

  const dismissNewBanner = useCallback(() => {
    setHasNewAnnouncements(false);
  }, []);

  const refresh = useCallback(async () => {
    dismissNewBanner();
    await fetchAnnouncements(false);
  }, [fetchAnnouncements, dismissNewBanner]);

  const unreadCount = announcements.filter((item) => !item.isRead).length;

  return {
    announcements,
    meta,
    isLoading,
    isRefreshing,
    error,
    unreadCount,
    lastSyncedAt,
    hasNewAnnouncements,
    dismissNewBanner,
    markAsRead,
    markAllAsRead,
    refresh,
  };
}
