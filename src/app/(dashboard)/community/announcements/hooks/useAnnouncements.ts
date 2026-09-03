"use client";

import { useState, useCallback, useEffect } from "react";
import {
  AnnouncementFormData,
  AnnouncementFilterState,
  AnnouncementItem,
  PaginationInfo,
  PropertyOption,
  AppUserRole,
} from "../types";

export interface ToastMessage {
  title: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

const initialFilters: AnnouncementFilterState = {
  search: "",
  status: "ALL",
  propertyId: "ALL",
  startDate: "",
  endDate: "",
  page: 1,
  limit: 10,
};

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [userRole, setUserRole] = useState<AppUserRole>("OWNER");
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AnnouncementFilterState>(initialFilters);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((title: string, message: string, type: ToastMessage["type"] = "success") => {
    setToast({ title, message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.title === title ? null : curr));
    }, 4000);
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  // Fetch properties and units for selector/filtering
  const fetchProperties = useCallback(async () => {
    try {
      const res = await fetch("/api/announcements/properties");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setProperties(json.data);
      }
    } catch (err: any) {
      console.error("Failed to load properties for announcement:", err);
    }
  }, []);

  // Fetch announcements list with current filters
  const fetchAnnouncements = useCallback(
    async (overrideFilters?: Partial<AnnouncementFilterState>) => {
      setLoading(true);
      setError(null);
      try {
        const activeFilters = { ...filters, ...(overrideFilters || {}) };
        const queryParams = new URLSearchParams();

        if (activeFilters.search) queryParams.set("search", activeFilters.search);
        if (activeFilters.status && activeFilters.status !== "ALL") {
          queryParams.set("status", activeFilters.status);
        }
        if (activeFilters.propertyId && activeFilters.propertyId !== "ALL") {
          queryParams.set("propertyId", activeFilters.propertyId);
        }
        if (activeFilters.startDate) queryParams.set("startDate", activeFilters.startDate);
        if (activeFilters.endDate) queryParams.set("endDate", activeFilters.endDate);
        queryParams.set("page", String(activeFilters.page));
        queryParams.set("limit", String(activeFilters.limit));

        const res = await fetch(`/api/announcements?${queryParams.toString()}`);
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.message || "Gagal memuat pengumuman");
        }

        setAnnouncements(json.data || []);
        if (json.meta?.pagination) {
          setPagination(json.meta.pagination);
        }
        if (json.meta?.userRole) {
          setUserRole(json.meta.userRole);
        }
      } catch (err: any) {
        console.error("fetchAnnouncements error:", err);
        setError(err.message || "Terjadi kesalahan saat memuat pengumuman");
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  // Filter setters
  const setFilter = useCallback(<K extends keyof AnnouncementFilterState>(
    key: K,
    value: AnnouncementFilterState[K]
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      ...(key !== "page" ? { page: 1 } : {}), // Reset page when any other filter changes
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const setPage = useCallback((newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  }, []);

  // Create announcement
  const createAnnouncement = useCallback(
    async (formData: AnnouncementFormData): Promise<boolean> => {
      setActionLoading(true);
      try {
        const res = await fetch("/api/announcements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.message || "Gagal membuat pengumuman");
        }

        showToast(
          "Pengumuman Dibuat",
          json.message || "Pengumuman berhasil diproses ke sistem.",
          "success"
        );
        await fetchAnnouncements();
        return true;
      } catch (err: any) {
        showToast("Gagal Membuat Pengumuman", err.message, "error");
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchAnnouncements, showToast]
  );

  // Update announcement (STRICT: only DRAFT or SCHEDULED)
  const updateAnnouncement = useCallback(
    async (id: string, formData: AnnouncementFormData): Promise<boolean> => {
      setActionLoading(true);
      try {
        const res = await fetch(`/api/announcements/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.message || "Gagal memperbarui pengumuman");
        }

        showToast(
          "Pengumuman Diperbarui",
          json.message || "Perubahan pengumuman telah disimpan.",
          "success"
        );
        await fetchAnnouncements();
        return true;
      } catch (err: any) {
        showToast("Gagal Mengedit", err.message, "error");
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchAnnouncements, showToast]
  );

  // Delete announcement
  const deleteAnnouncement = useCallback(
    async (id: string): Promise<boolean> => {
      setActionLoading(true);
      try {
        const res = await fetch(`/api/announcements/${id}`, {
          method: "DELETE",
        });
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.message || "Gagal menghapus pengumuman");
        }

        showToast("Pengumuman Dihapus", "Pengumuman telah berhasil dihapus dari sistem.", "info");
        await fetchAnnouncements();
        return true;
      } catch (err: any) {
        showToast("Gagal Menghapus", err.message, "error");
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchAnnouncements, showToast]
  );

  // Archive / unarchive announcement
  const archiveAnnouncement = useCallback(
    async (id: string): Promise<boolean> => {
      setActionLoading(true);
      try {
        const res = await fetch(`/api/announcements/${id}/archive`, {
          method: "PATCH",
        });
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.message || "Gagal mengubah status arsip");
        }

        showToast(
          "Status Arsip Diperbarui",
          json.message || "Status arsip pengumuman telah diubah.",
          "info"
        );
        await fetchAnnouncements();
        return true;
      } catch (err: any) {
        showToast("Gagal Mengarsipkan", err.message, "error");
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchAnnouncements, showToast]
  );

  // Initial load
  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  return {
    announcements,
    properties,
    userRole,
    loading,
    actionLoading,
    error,
    filters,
    pagination,
    toast,
    showToast,
    hideToast,
    setFilter,
    resetFilters,
    setPage,
    fetchAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    archiveAnnouncement,
  };
}
