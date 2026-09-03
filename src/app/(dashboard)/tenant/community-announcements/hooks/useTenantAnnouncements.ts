"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { TenantAnnouncement, TenantAnnouncementFilter, TenantAnnouncementMeta } from "../types";

const LOCAL_STORAGE_READ_KEY = "arventa_tenant_read_announcements";

export function useTenantAnnouncements(initialTab: "LATEST" | "HISTORY" = "LATEST") {
  const [filter, setFilterState] = useState<TenantAnnouncementFilter>({
    tab: initialTab,
    search: "",
  });

  const [announcements, setAnnouncements] = useState<TenantAnnouncement[]>([]);
  const [meta, setMeta] = useState<TenantAnnouncementMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  // Local Read IDs Cache
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_READ_KEY);
        if (stored) {
          return new Set<string>(JSON.parse(stored));
        }
      } catch (err) {
        console.warn("Failed to load read announcements from localStorage:", err);
      }
    }
    return new Set<string>();
  });

  // Save read IDs to localStorage
  const saveReadIds = useCallback((newSet: Set<string>) => {
    setReadIds(newSet);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(LOCAL_STORAGE_READ_KEY, JSON.stringify(Array.from(newSet)));
      } catch (err) {
        console.warn("Failed to persist read announcements to localStorage:", err);
      }
    }
  }, []);

  // Fetch announcements from API
  const fetchAnnouncements = useCallback(
    async (isBackgroundSync = false) => {
      if (isBackgroundSync) {
        setIsSyncing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const queryParams = new URLSearchParams();
        queryParams.set("tab", filter.tab);
        if (filter.search?.trim()) {
          queryParams.set("search", filter.search.trim());
        }

        const res = await fetch(`/api/tenant/announcements?${queryParams.toString()}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          console.warn("fetchAnnouncements warning:", errData?.message || res.statusText);
          return;
        }

        const json = await res.json();
        const items: TenantAnnouncement[] = Array.isArray(json.data) ? json.data : [];

        // Apply local read tracking
        const enrichedItems = items.map((item) => ({
          ...item,
          isRead: readIds.has(item.id),
        }));

        setAnnouncements(enrichedItems);
        setMeta(json.meta || null);
        setLastSyncedAt(new Date());
      } catch (err: any) {
        console.error("useTenantAnnouncements fetch error:", err);
        setError(err.message || "Terjadi kesalahan saat memuat data pengumuman.");
      } finally {
        setIsLoading(false);
        setIsSyncing(false);
      }
    },
    [filter.tab, filter.search, readIds]
  );

  // Initial and reactive fetch on filter change
  useEffect(() => {
    fetchAnnouncements(false);
  }, [filter.tab, filter.search]);

  // Realtime Polling & Window Focus Auto-Sync
  const fetchRef = useRef(fetchAnnouncements);
  fetchRef.current = fetchAnnouncements;

  useEffect(() => {
    // 1. Polling interval every 20 seconds
    const interval = setInterval(() => {
      fetchRef.current(true);
    }, 20000);

    // 2. Window focus revalidation
    const handleFocus = () => {
      fetchRef.current(true);
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // Mark single announcement as read
  const markAsRead = useCallback(
    (id: string) => {
      if (readIds.has(id)) return;

      const nextSet = new Set(readIds);
      nextSet.add(id);
      saveReadIds(nextSet);

      setAnnouncements((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
      );
    },
    [readIds, saveReadIds]
  );

  // Mark all visible announcements as read
  const markAllAsRead = useCallback(() => {
    const nextSet = new Set(readIds);
    announcements.forEach((a) => nextSet.add(a.id));
    saveReadIds(nextSet);

    setAnnouncements((prev) => prev.map((item) => ({ ...item, isRead: true })));
  }, [announcements, readIds, saveReadIds]);

  // Set filter safely
  const setFilter = useCallback((newFilter: Partial<TenantAnnouncementFilter>) => {
    setFilterState((prev) => ({
      ...prev,
      ...newFilter,
    }));
  }, []);

  // Calculate unread count
  const unreadCount = announcements.filter((a) => !a.isRead).length;

  return {
    announcements,
    meta,
    isLoading,
    isSyncing,
    error,
    lastSyncedAt,
    filter,
    setFilter,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refresh: () => fetchAnnouncements(true),
  };
}
