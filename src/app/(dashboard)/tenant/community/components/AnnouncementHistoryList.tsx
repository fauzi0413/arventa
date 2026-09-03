"use client";

import React from "react";
import {
  IconSearch,
  IconArchive,
  IconInfoCircle,
} from "@tabler/icons-react";
import { TenantAnnouncementItem } from "../types";
import { AnnouncementCard } from "./AnnouncementCard";

interface AnnouncementHistoryListProps {
  announcements: TenantAnnouncementItem[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectAnnouncement: (announcement: TenantAnnouncementItem) => void;
}

export function AnnouncementHistoryList({
  announcements,
  searchQuery,
  onSearchChange,
  onSelectAnnouncement,
}: AnnouncementHistoryListProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* Archive Information Banner */}
      <div className="flex items-start gap-3 rounded-2xl bg-muted/40 border border-border/80 p-4 text-xs text-muted-foreground">
        <IconInfoCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <p className="font-semibold text-foreground text-sm">
            Arsip Riwayat Pengumuman
          </p>
          <p className="mt-0.5">
            Menampilkan pengumuman resmi yang telah dirilis lebih dari 30 hari
            yang lalu. Anda dapat membaca kembali aturan, jadwal, atau informasi
            lampau kapan saja.
          </p>
        </div>
      </div>

      {/* Instant Search Bar */}
      <div className="relative max-w-md">
        <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari dalam arsip pengumuman..."
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

      {/* Grid of Historical Announcements */}
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
              <IconArchive className="h-8 w-8" />
            )}
          </div>

          <h4 className="text-base font-bold text-foreground">
            {searchQuery
              ? "Tidak Ada Arsip yang Cocok"
              : "Belum Ada Riwayat Pengumuman Lampau"}
          </h4>

          <p className="mt-1.5 max-w-sm text-xs text-muted-foreground leading-relaxed">
            {searchQuery
              ? `Tidak ditemukan pengumuman lampau yang sesuai dengan pencarian "${searchQuery}".`
              : "Pengumuman yang telah terbit lebih dari 30 hari akan secara otomatis dipindahkan ke tab arsip ini."}
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

export default AnnouncementHistoryList;
