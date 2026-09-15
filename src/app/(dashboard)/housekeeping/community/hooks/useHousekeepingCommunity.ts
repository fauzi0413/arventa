"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ForumThreadItem,
  ForumMetrics,
  ForumFilterState,
  AssignedPropertyOption,
  CreateTopicInput,
} from "../types";

export function useHousekeepingCommunity() {
  const [threads, setThreads] = useState<ForumThreadItem[]>([]);
  const [assignedProperties, setAssignedProperties] = useState<AssignedPropertyOption[]>([]);
  const [metrics, setMetrics] = useState<ForumMetrics>({
    totalPosts: 0,
    welcomePostsCount: 0,
    discussionsCount: 0,
    totalRepliesCount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date>(new Date());

  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const [filters, setFilters] = useState<ForumFilterState>({
    search: "",
    propertyId: "ALL",
    category: "ALL",
    status: "ALL",
  });

  const showToast = useCallback(
    (type: "success" | "error" | "info", message: string) => {
      setToast({ type, message });
      setTimeout(() => {
        setToast((curr) => (curr?.message === message ? null : curr));
      }, 4000);
    },
    []
  );

  const hideToast = useCallback(() => setToast(null), []);

  const setFilter = useCallback((key: keyof ForumFilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      search: "",
      propertyId: "ALL",
      category: "ALL",
      status: "ALL",
    });
  }, []);

  // Fetch forum threads and metrics
  const fetchCommunityData = useCallback(
    async (isManualRefresh = false) => {
      try {
        if (isManualRefresh) setRefreshing(true);
        else setLoading(true);

        setError(null);
        const params = new URLSearchParams();
        if (filters.search.trim()) params.set("search", filters.search.trim());
        if (filters.propertyId && filters.propertyId !== "ALL") {
          params.set("propertyId", filters.propertyId);
        }
        if (filters.category && filters.category !== "ALL") {
          params.set("category", filters.category);
        }
        if (filters.status && filters.status !== "ALL") {
          params.set("status", filters.status);
        }

        const res = await fetch(`/api/community/forum?${params.toString()}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Gagal memuat data forum komunitas");
        }

        const json = await res.json();
        if (json.success && json.data) {
          setThreads(json.data.posts || []);
          if (Array.isArray(json.data.assignedProperties)) {
            setAssignedProperties(json.data.assignedProperties);
          }
          if (json.data.metrics) {
            setMetrics(json.data.metrics);
          }
          setLastSyncedAt(new Date());
        }
      } catch (err: any) {
        console.error("Error loading housekeeping community:", err);
        setError(err.message || "Terjadi kesalahan sistem.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    fetchCommunityData();
  }, [fetchCommunityData]);

  // Reply to thread (Acceptance Criterion #1)
  const replyToThread = useCallback(
    async (threadId: string, content: string): Promise<boolean> => {
      if (!content.trim()) {
        showToast("error", "Isi balasan tidak boleh kosong");
        return false;
      }

      setActionLoading(true);
      try {
        const res = await fetch(`/api/community/forum/${threadId}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: content.trim() }),
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) {
          throw new Error(json.message || "Gagal mengirimkan balasan");
        }

        // Optimistically update local thread comments
        const newComment = json.data;
        setThreads((prev) =>
          prev.map((t) => {
            if (t.id === threadId) {
              return {
                ...t,
                commentsCount: t.commentsCount + 1,
                comments: [...t.comments, newComment],
                updatedAt: new Date().toISOString(),
              };
            }
            return t;
          })
        );

        setMetrics((prev) => ({
          ...prev,
          totalRepliesCount: prev.totalRepliesCount + 1,
        }));

        showToast("success", "Balasan berhasil dikirimkan");
        return true;
      } catch (err: any) {
        console.error("Error replying to thread:", err);
        showToast("error", err.message || "Gagal mengirimkan balasan");
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [showToast]
  );

  // Mark complaint as resolved (Acceptance Criterion #2)
  const resolveComplaint = useCallback(
    async (threadId: string, resolutionNotes?: string): Promise<boolean> => {
      setActionLoading(true);
      try {
        const res = await fetch(`/api/community/forum/${threadId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "RESOLVED",
            resolutionNotes: resolutionNotes || "",
          }),
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) {
          throw new Error(json.message || "Gagal menandai keluhan sebagai selesai");
        }

        const updated = json.data;
        setThreads((prev) =>
          prev.map((t) => (t.id === threadId ? { ...t, ...updated } : t))
        );

        showToast("success", "Status berhasil diperbarui");
        // Trigger a background refresh to synchronize thread & metrics
        fetchCommunityData(true);
        return true;
      } catch (err: any) {
        console.error("Error resolving complaint:", err);
        showToast("error", err.message || "Gagal menyelesaikan keluhan");
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [showToast, fetchCommunityData]
  );

  // Reopen resolved thread
  const reopenThread = useCallback(
    async (threadId: string): Promise<boolean> => {
      setActionLoading(true);
      try {
        const res = await fetch(`/api/community/forum/${threadId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "OPEN" }),
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) {
          throw new Error(json.message || "Gagal membuka kembali diskusi");
        }

        const updated = json.data;
        setThreads((prev) =>
          prev.map((t) => (t.id === threadId ? { ...t, ...updated } : t))
        );

        showToast("info", "Status diskusi diubah menjadi Terbuka");
        fetchCommunityData(true);
        return true;
      } catch (err: any) {
        console.error("Error reopening thread:", err);
        showToast("error", err.message || "Gagal membuka diskusi");
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [showToast, fetchCommunityData]
  );

  // Create new thread/topic
  const createThread = useCallback(
    async (input: CreateTopicInput): Promise<boolean> => {
      setActionLoading(true);
      try {
        const res = await fetch("/api/community/forum", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) {
          throw new Error(json.message || "Gagal membuat topik diskusi baru");
        }

        const newPost = json.data;
        setThreads((prev) => [newPost, ...prev]);
        setMetrics((prev) => ({
          ...prev,
          totalPosts: prev.totalPosts + 1,
          welcomePostsCount:
            newPost.category === "SAMBUTAN"
              ? prev.welcomePostsCount + 1
              : prev.welcomePostsCount,
          discussionsCount:
            newPost.category !== "SAMBUTAN"
              ? prev.discussionsCount + 1
              : prev.discussionsCount,
        }));

        showToast("success", "Topik diskusi berhasil diterbitkan");
        return true;
      } catch (err: any) {
        console.error("Error creating thread:", err);
        showToast("error", err.message || "Gagal menerbitkan topik");
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [showToast]
  );

  // Delete/moderate thread
  const deleteThread = useCallback(
    async (threadId: string): Promise<boolean> => {
      setActionLoading(true);
      try {
        const res = await fetch(`/api/community/forum/${threadId}`, {
          method: "DELETE",
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) {
          throw new Error(json.message || "Gagal menghapus thread diskusi");
        }

        setThreads((prev) => prev.filter((t) => t.id !== threadId));
        setMetrics((prev) => ({
          ...prev,
          totalPosts: Math.max(0, prev.totalPosts - 1),
        }));

        showToast("success", "Thread berhasil dimoderasi / dihapus");
        return true;
      } catch (err: any) {
        console.error("Error deleting thread:", err);
        showToast("error", err.message || "Gagal menghapus thread");
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [showToast]
  );

  return {
    threads,
    assignedProperties,
    metrics,
    loading,
    refreshing,
    actionLoading,
    error,
    lastSyncedAt,
    filters,
    toast,
    setFilter,
    resetFilters,
    replyToThread,
    resolveComplaint,
    reopenThread,
    createThread,
    deleteThread,
    refresh: () => fetchCommunityData(true),
    hideToast,
    showToast,
  };
}
