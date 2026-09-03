"use client";

import React from "react";
import {
  IconSearch,
  IconCheck,
  IconBellOff,
  IconRefresh,
  IconSparkles,
  IconAlertCircle,
} from "@tabler/icons-react";
import { TenantAnnouncementItem } from "../types";
import { AnnouncementCard } from "./AnnouncementCard";

interface AnnouncementFeedProps {
  announcements: TenantAnnouncementItem[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectAnnouncement: (announcement: TenantAnnouncementItem) => void;
  onMarkAllAsRead: () => void;
  unreadCount: number;
  hasNewAnnouncements: boolean;
  onRefreshNew: () => void;
  error?: string | null;
  isRefreshing?: boolean;
}

export function AnnouncementFeed({
  announcements,
  searchQuery,
  onSearchChange,
  onSelectAnnouncement,
  onMarkAllAsRead,
  unreadCount,
  hasNewAnnouncements,
  onRefreshNew,
  error,
  isRefreshing,
}: AnnouncementFeedProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* New Announcements Banner (when realtime background sync detects updates) */}
      {hasNewAnnouncements && (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 p-4 text-blue-700 dark:text-blue-300 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 shrink-0">
              <IconSparkles className="h-4 w-4 animate-spin" />
            </div>
            <div>
              <p className="text-sm font-semibold">Pengumuman Baru Tersedia!</p>
              <p className="text-xs opacity-80">
                Pihak pengelola kost baru saja menerbitkan pengumuman terkini.
              </p>
            </div>
          </div>

          <button
            onClick={onRefreshNew}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors shrink-0"
          >
            <IconRefresh className="h-3.5 w-3.5" />
            <span>Muat Sekarang</span>
          </button>
        </div>
      )}

      {/* Gentle Error Notice Banner (Non-intrusive, no crash overlay) */}
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-amber-500/10 border border-amber-500/30 p-3.5 text-amber-800 dark:text-amber-300 text-xs">
          <div className="flex items-center gap-2">
            <IconAlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>{error} (Menampilkan data cache sebelumnya)</span>
          </div>
          <button
            onClick={onRefreshNew}
            disabled={isRefreshing}
            className="underline hover:text-amber-900 dark:hover:text-amber-200 font-semibold"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Search Bar & Action Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Instant Search Bar */}
        <div className="relative flex-1 max-w-md">
          <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari judul atau isi pengumuman..."
            className="w-full h-11 rounded-xl border border-input bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground py-1 px-1.5"
            >
              Hapus
            </button>
          )}
        </div>

        {/* Action: Mark All as Read */}
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground/80 hover:bg-muted hover:text-foreground transition-colors shadow-xs"
          >
            <IconCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Tandai Semua Dibaca ({unreadCount})</span>
          </button>
        )}
      </div>

      {/* Feed Card Grid */}
      {announcements.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {announcements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              onClick={onSelectAnnouncement}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 p-12 text-center bg-card/40">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground/60 mb-4">
            {searchQuery ? (
              <IconSearch className="h-8 w-8" />
            ) : (
              <IconBellOff className="h-8 w-8" />
            )}
          </div>

          <h4 className="text-base font-bold text-foreground">
            {searchQuery
              ? "Tidak Ada Pengumuman yang Cocok"
              : "Belum Ada Pengumuman Aktif"}
          </h4>

          <p className="mt-1.5 max-w-sm text-xs text-muted-foreground leading-relaxed">
            {searchQuery
              ? `Tidak ditemukan pengumuman yang sesuai dengan kata kunci "${searchQuery}". Silakan coba kata kunci lain.`
              : "Pengelola kost atau staf housekeeping belum mempublikasikan pengumuman baru untuk properti Anda."}
          </p>

          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="mt-4 inline-flex min-h-[40px] items-center justify-center rounded-xl bg-secondary px-4 py-2 text-xs font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              Reset Pencarian
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default AnnouncementFeed;
