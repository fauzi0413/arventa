"use client";

import React, { useState, Suspense, lazy } from "react";
import {
  IconSpeakerphone,
  IconHistory,
  IconBell,
  IconBuildingCommunity,
} from "@tabler/icons-react";
import { useTenantAnnouncements } from "./hooks/useTenantAnnouncements";
import { RealtimeIndicator } from "./components/RealtimeIndicator";
import { TenantAnnouncementFeed } from "./components/TenantAnnouncementFeed";
import { AnnouncementHistoryTab } from "./components/AnnouncementHistoryTab";
import { TenantAnnouncement } from "./types";

// Lazy-load detail drawer/modal for optimized initial load
const TenantAnnouncementDetail = lazy(
  () => import("./components/TenantAnnouncementDetail")
);

export default function TenantCommunityAnnouncementsPage() {
  const {
    announcements,
    meta,
    isLoading,
    isSyncing,
    lastSyncedAt,
    filter,
    setFilter,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refresh,
  } = useTenantAnnouncements();

  // Selected announcement for detail drawer/modal
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<TenantAnnouncement | null>(null);

  const handleSelectAnnouncement = (ann: TenantAnnouncement) => {
    setSelectedAnnouncement(ann);
    markAsRead(ann.id);
  };

  const handleCloseDetail = () => {
    setSelectedAnnouncement(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <IconBuildingCommunity className="h-4 w-4" />
            <span>Komunitas Properti</span>
          </div>
          <h1 className="mt-1 text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            Pengumuman Kost
          </h1>
          <p className="mt-1 text-xs md:text-sm text-muted-foreground">
            Informasi resmi, pemberitahuan operasional, dan kabar penting untuk unit Anda di{" "}
            <span className="font-semibold text-foreground">
              {meta?.tenantProperty || "Kost Anda"}
            </span>
            {meta?.tenantUnit && (
              <span className="ml-1 rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground">
                Kamar {meta.tenantUnit}
              </span>
            )}
          </p>
        </div>

        {/* Realtime Live Sync Status Indicator */}
        <div className="self-start sm:self-auto">
          <RealtimeIndicator
            isSyncing={isSyncing}
            lastSyncedAt={lastSyncedAt}
            onRefresh={refresh}
          />
        </div>
      </div>

      {/* Navigation Tabs (Terbaru vs Riwayat) */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-px">
        {/* Latest Announcements Tab */}
        <button
          type="button"
          onClick={() => setFilter({ tab: "LATEST" })}
          className={`flex min-h-[44px] items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
            filter.tab === "LATEST"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
          }`}
        >
          <IconBell className="h-4 w-4" />
          <span>Pengumuman Terbaru</span>
          {unreadCount > 0 && (
            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-bold text-white shadow-xs">
              {unreadCount}
            </span>
          )}
        </button>

        {/* History Archive Tab */}
        <button
          type="button"
          onClick={() => setFilter({ tab: "HISTORY" })}
          className={`flex min-h-[44px] items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
            filter.tab === "HISTORY"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
          }`}
        >
          <IconHistory className="h-4 w-4" />
          <span>Riwayat Lampau</span>
        </button>
      </div>

      {/* Main Tab Views */}
      {filter.tab === "LATEST" ? (
        <TenantAnnouncementFeed
          announcements={announcements}
          isLoading={isLoading}
          unreadCount={unreadCount}
          searchQuery={filter.search || ""}
          onSearchChange={(q) => setFilter({ search: q })}
          onSelectAnnouncement={handleSelectAnnouncement}
          onMarkAllAsRead={markAllAsRead}
        />
      ) : (
        <AnnouncementHistoryTab
          announcements={announcements}
          isLoading={isLoading}
          searchQuery={filter.search || ""}
          onSearchChange={(q) => setFilter({ search: q })}
          onSelectAnnouncement={handleSelectAnnouncement}
        />
      )}

      {/* Lazy-Loaded Announcement Detail Drawer/Modal */}
      {selectedAnnouncement && (
        <Suspense fallback={null}>
          <TenantAnnouncementDetail
            announcement={selectedAnnouncement}
            isOpen={Boolean(selectedAnnouncement)}
            onClose={handleCloseDetail}
            onMarkAsRead={markAsRead}
          />
        </Suspense>
      )}
    </div>
  );
}
