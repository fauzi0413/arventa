"use client";

import React from "react";
import {
  IconHistory,
  IconSearch,
  IconX,
  IconArchive,
  IconInbox,
} from "@tabler/icons-react";
import { TenantAnnouncement } from "../types";
import { TenantAnnouncementCard } from "./TenantAnnouncementCard";

interface AnnouncementHistoryTabProps {
  announcements: TenantAnnouncement[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectAnnouncement: (announcement: TenantAnnouncement) => void;
}

export function AnnouncementHistoryTab({
  announcements,
  isLoading,
  searchQuery,
  onSearchChange,
  onSelectAnnouncement,
}: AnnouncementHistoryTabProps) {
  return (
    <div className="space-y-6">
      {/* Archive Information Banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-4 text-xs md:text-sm text-muted-foreground">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <IconArchive className="h-4 w-4" />
        </div>
        <div className="flex-1 space-y-0.5">
          <p className="font-semibold text-foreground">
            Riwayat Pengumuman Lampau
          </p>
          <p className="leading-relaxed">
            Halaman ini memuat arsip seluruh pengumuman resmi yang telah dirilis lebih dari 30 hari yang lalu untuk referensi dan rekapitulasi Anda.
          </p>
        </div>
      </div>

      {/* Quick Search Bar */}
      <div className="relative flex items-center">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
          <IconSearch className="h-4 w-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari arsip pengumuman lampau..."
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

      {/* Announcements List / Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
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
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border py-14 px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground mb-4">
            {searchQuery ? (
              <IconSearch className="h-7 w-7" />
            ) : (
              <IconHistory className="h-7 w-7" />
            )}
          </div>
          <h3 className="text-base font-semibold text-foreground">
            {searchQuery
              ? "Tidak Ada Arsip yang Cocok"
              : "Belum Ada Riwayat Lampau"}
          </h3>
          <p className="mt-1.5 max-w-sm text-xs md:text-sm text-muted-foreground leading-relaxed">
            {searchQuery
              ? `Tidak ditemukan pengumuman lampau dengan kata kunci "${searchQuery}". Coba kata kunci lain.`
              : "Pengumuman yang telah melewati masa tayang 30 hari akan diarsipkan secara otomatis di tab ini."}
          </p>
        </div>
      )}
    </div>
  );
}
