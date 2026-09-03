"use client";

import React from "react";
import {
  IconSearch,
  IconX,
  IconChecks,
  IconSpeakerphone,
  IconBellRinging,
} from "@tabler/icons-react";
import { TenantAnnouncement } from "../types";
import { TenantAnnouncementCard } from "./TenantAnnouncementCard";

interface TenantAnnouncementFeedProps {
  announcements: TenantAnnouncement[];
  isLoading: boolean;
  unreadCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectAnnouncement: (announcement: TenantAnnouncement) => void;
  onMarkAllAsRead: () => void;
}

export function TenantAnnouncementFeed({
  announcements,
  isLoading,
  unreadCount,
  searchQuery,
  onSearchChange,
  onSelectAnnouncement,
  onMarkAllAsRead,
}: TenantAnnouncementFeedProps) {
  return (
    <div className="space-y-6">
      {/* Controls Bar: Search + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
            <IconSearch className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari pengumuman aktif..."
            className="flex h-11 w-full rounded-2xl border border-input bg-card pl-10 pr-10 text-sm text-foreground shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted-foreground hover:text-foreground"
            >
              <IconX className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Mark All Read Action */}
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllAsRead}
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-2xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground shadow-xs hover:bg-muted transition-colors cursor-pointer shrink-0"
          >
            <IconChecks className="h-4 w-4 text-primary" />
            <span>Tandai Semua Dibaca ({unreadCount})</span>
          </button>
        )}
      </div>

      {/* Feed Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-44 rounded-2xl border border-border/60 bg-muted/20 animate-pulse p-5"
            />
          ))}
        </div>
      ) : announcements.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {announcements.map((ann) => (
            <TenantAnnouncementCard
              key={ann.id}
              announcement={ann}
              onClick={onSelectAnnouncement}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border py-16 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary mb-4 shadow-xs">
            {searchQuery ? (
              <IconSearch className="h-8 w-8" />
            ) : (
              <IconSpeakerphone className="h-8 w-8" />
            )}
          </div>
          <h3 className="text-lg font-bold text-foreground">
            {searchQuery
              ? "Pengumuman Tidak Ditemukan"
              : "Belum Ada Pengumuman Baru"}
          </h3>
          <p className="mt-1.5 max-w-sm text-sm text-muted-foreground leading-relaxed">
            {searchQuery
              ? `Tidak ditemukan pengumuman yang memuat kata kunci "${searchQuery}". Silakan coba kata kunci lain.`
              : "Saat ini belum ada pengumuman baru dari pengelola kost atau tim housekeeping untuk kamar/properti Anda."}
          </p>
        </div>
      )}
    </div>
  );
}
