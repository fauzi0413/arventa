"use client";

import React, { useState, Suspense, lazy } from "react";
import {
  IconSpeakerphone,
  IconBell,
  IconArchive,
  IconBuildingCommunity,
} from "@tabler/icons-react";
import { CommunityTab, TenantAnnouncementItem } from "./types";
import { useTenantCommunity } from "./hooks/useTenantCommunity";
import { RealtimeSyncBadge } from "./components/RealtimeSyncBadge";
import { AnnouncementFeed } from "./components/AnnouncementFeed";
import { AnnouncementHistoryList } from "./components/AnnouncementHistoryList";

// Lazy-load AnnouncementDetailDrawer for performance & code splitting
const AnnouncementDetailDrawer = lazy(
  () => import("./components/AnnouncementDetailDrawer")
);

export default function TenantCommunityPage() {
  const [activeTab, setActiveTab] = useState<CommunityTab>("ACTIVE");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<TenantAnnouncementItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  const {
    announcements,
    meta,
    isLoading,
    isRefreshing,
    error,
    unreadCount,
    lastSyncedAt,
    hasNewAnnouncements,
    markAsRead,
    markAllAsRead,
    refresh,
  } = useTenantCommunity({
    activeTab,
    searchQuery,
  });

  const handleOpenDetail = (announcement: TenantAnnouncementItem) => {
    setSelectedAnnouncement(announcement);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <IconSpeakerphone className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                Komunitas & Pengumuman
              </h1>
              {/* Dynamic Property / Unit Context */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <IconBuildingCommunity className="h-3.5 w-3.5" />
                <span>
                  {meta?.tenantProperty ? (
                    <>
                      <strong className="text-foreground/90 font-medium">
                        {meta.tenantProperty}
                      </strong>
                      {meta.tenantUnit ? ` • ${meta.tenantUnit}` : ""}
                    </>
                  ) : (
                    "Papan Pengumuman Resmi Kost"
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Realtime Connection & Auto-Sync Indicator */}
        <div className="self-start sm:self-auto">
          <RealtimeSyncBadge
            lastSyncedAt={lastSyncedAt}
            isRefreshing={isRefreshing}
            onRefresh={refresh}
          />
        </div>
      </div>

      {/* Tabs Switcher: ACTIVE vs HISTORY */}
      <div className="flex items-center border-b border-border/80 gap-2">
        {/* Tab 1: Pengumuman Aktif */}
        <button
          onClick={() => {
            setActiveTab("ACTIVE");
            setSearchQuery("");
          }}
          className={`flex min-h-[44px] items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "ACTIVE"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <IconBell className="h-4 w-4" />
          <span>Pengumuman Aktif</span>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-blue-600 text-white px-2 py-0.5 text-[11px] font-bold">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Tab 2: Riwayat Pengumuman (> 30 hari) */}
        <button
          onClick={() => {
            setActiveTab("HISTORY");
            setSearchQuery("");
          }}
          className={`flex min-h-[44px] items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "HISTORY"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <IconArchive className="h-4 w-4" />
          <span>Riwayat Lampau</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-1">
        {isLoading && announcements.length === 0 ? (
          // Initial Loading Shimmer Skeleton
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pt-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 min-h-[170px] animate-pulse"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-5 w-24 rounded-md bg-muted" />
                    <div className="h-4 w-28 rounded-md bg-muted/60" />
                  </div>
                  <div className="h-5 w-3/4 rounded-md bg-muted/90" />
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-full rounded-md bg-muted/50" />
                    <div className="h-3.5 w-4/5 rounded-md bg-muted/50" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === "ACTIVE" ? (
          <AnnouncementFeed
            announcements={announcements}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectAnnouncement={handleOpenDetail}
            onMarkAllAsRead={markAllAsRead}
            unreadCount={unreadCount}
            hasNewAnnouncements={hasNewAnnouncements}
            onRefreshNew={refresh}
            error={error}
            isRefreshing={isRefreshing}
          />
        ) : (
          <AnnouncementHistoryList
            announcements={announcements}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectAnnouncement={handleOpenDetail}
          />
        )}
      </div>

      {/* Lazy Loaded Announcement Detail Modal / Bottom Sheet Drawer */}
      <Suspense fallback={null}>
        {isDetailOpen && selectedAnnouncement && (
          <AnnouncementDetailDrawer
            announcement={selectedAnnouncement}
            isOpen={isDetailOpen}
            onClose={handleCloseDetail}
            onMarkAsRead={markAsRead}
          />
        )}
      </Suspense>
    </div>
  );
}
