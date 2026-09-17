"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  IconBuildingCommunity,
  IconUsers,
  IconRefresh,
  IconChevronDown,
  IconSpeakerphone,
  IconCheck,
  IconArrowLeft,
} from "@tabler/icons-react";
import {
  ChatRoomProperty,
  AvailablePropertyOption,
} from "../types/chat";

interface ChatHeaderProps {
  property: ChatRoomProperty | null;
  availableProperties: AvailablePropertyOption[];
  activeTenantsCount: number;
  managementCount: number;
  isRealtimeConnected: boolean;
  refreshing: boolean;
  currentUserRole?: string;
  onRefresh: () => void;
  onSwitchProperty: (propertyId: string) => void;
  onOpenResidents: () => void;
  onOpenCreateAnnouncement?: () => void;
  onBackToChatList?: () => void;
}

export function ChatHeader({
  property,
  availableProperties,
  activeTenantsCount,
  managementCount,
  isRealtimeConnected,
  refreshing,
  currentUserRole,
  onRefresh,
  onSwitchProperty,
  onOpenResidents,
  onOpenCreateAnnouncement,
  onBackToChatList,
}: ChatHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Property initial initials
  const initials = property?.name
    ? property.name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "AR";

  const isAdmin =
    currentUserRole === "OWNER" ||
    currentUserRole === "HOUSEKEEPING" ||
    currentUserRole === "PLATFORM_ADMIN";

  return (
    <div className="relative z-20 flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-card border border-border/80 shadow-md backdrop-blur-md">
      {/* Left: Back button & Property Info & Selector */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Back Button (WhatsApp mobile style) */}
        {onBackToChatList && (
          <button
            type="button"
            onClick={onBackToChatList}
            className="p-2 rounded-2xl border border-border/80 bg-muted/40 hover:bg-muted text-foreground transition-all shrink-0 hover:scale-105 active:scale-95 cursor-pointer"
            title="Kembali ke Daftar Percakapan"
            aria-label="Kembali"
          >
            <IconArrowLeft className="h-5 w-5" />
          </button>
        )}

        {/* Avatar / Initial */}
        <div className="relative shrink-0">
          {property?.coverImage ? (
            <img
              src={property.coverImage}
              alt={property.name}
              className="h-12 w-12 sm:h-13 sm:w-13 rounded-2xl object-cover border border-border shadow-xs"
            />
          ) : (
            <div className="flex h-12 w-12 sm:h-13 sm:w-13 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8FA28A] to-[#6E8069] text-white font-black text-lg shadow-sm border border-white/20">
              {initials}
            </div>
          )}
          <span
            className={`absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-card ${
              isRealtimeConnected ? "bg-emerald-500" : "bg-amber-500"
            }`}
            title={isRealtimeConnected ? "Realtime Aktif" : "Sinkronisasi Otomatis"}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isRealtimeConnected ? "bg-white animate-pulse" : "bg-white"
              }`}
            />
          </span>
        </div>

        {/* Title & Subtitle */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {availableProperties.length > 1 ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  className="group flex items-center gap-1.5 text-left font-black text-foreground hover:text-[#8FA28A] transition-colors"
                >
                  <h2 className="text-base sm:text-lg font-black tracking-tight truncate max-w-[180px] sm:max-w-xs">
                    {property?.name || "Memuat Properti..."}
                  </h2>
                  <IconChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground group-hover:text-[#8FA28A] transition-transform ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    <div className="absolute left-0 top-full mt-2 z-40 w-72 rounded-2xl border border-border bg-card p-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60 mb-1">
                        Pilih Properti Kost
                      </div>
                      <div className="max-h-60 overflow-y-auto space-y-1">
                        {availableProperties.map((p) => {
                          const isSelected = p.id === property?.id;
                          return (
                            <button
                              key={p.id}
                              onClick={() => {
                                onSwitchProperty(p.id);
                                setIsDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-colors ${
                                isSelected
                                  ? "bg-[#8FA28A]/15 text-[#8FA28A] font-bold"
                                  : "hover:bg-muted text-foreground"
                              }`}
                            >
                              <div className="truncate pr-2">
                                <p className="font-semibold truncate">{p.name}</p>
                                {p.city && (
                                  <p className="text-[11px] text-muted-foreground truncate">
                                    {p.city}
                                  </p>
                                )}
                              </div>
                              {isSelected && (
                                <IconCheck className="h-4 w-4 shrink-0 text-[#8FA28A]" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <h2 className="text-base sm:text-lg font-black tracking-tight text-foreground truncate max-w-[200px] sm:max-w-xs">
                {property?.name || "Memuat Ruang Kost..."}
              </h2>
            )}

            {/* Kost Badge */}
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-[#8FA28A]/15 text-[#8FA28A] border border-[#8FA28A]/30">
              Grup Warga Kost
            </span>
          </div>

          {/* Subtitle count & status */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <span className="font-semibold text-foreground/90">
              {activeTenantsCount} Penghuni Aktif
            </span>
            <span>•</span>
            <span className="font-medium">{managementCount} Pengelola</span>
            <span>•</span>
            <span
              className={`inline-flex items-center gap-1 font-semibold ${
                isRealtimeConnected
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-amber-600 dark:text-amber-400"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isRealtimeConnected ? "bg-emerald-500 animate-ping" : "bg-amber-500"
                }`}
              />
              {isRealtimeConnected ? "Realtime Aktif" : "Sync Otomatis"}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
        {/* Admin Broadcast Pinned Announcement Button */}
        {isAdmin && onOpenCreateAnnouncement && (
          <button
            type="button"
            onClick={onOpenCreateAnnouncement}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
            title="Siarkan Pengumuman Tersemat ke Warga"
          >
            <IconSpeakerphone className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span className="hidden sm:inline">Pin Pengumuman</span>
          </button>
        )}

        {/* Daftar Warga Drawer Button */}
        <button
          type="button"
          onClick={onOpenResidents}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
          title="Daftar Penghuni & Pengelola"
        >
          <IconUsers className="h-4 w-4" />
          <span>Daftar Warga</span>
          <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-white/20 dark:bg-zinc-900/20 text-[11px]">
            {activeTenantsCount}
          </span>
        </button>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="p-2 rounded-xl border border-border/80 bg-card hover:bg-muted text-foreground transition-all disabled:opacity-50 cursor-pointer"
          title="Sinkronisasi pesan terbaru"
        >
          <IconRefresh className={`h-4 w-4 ${refreshing ? "animate-spin text-[#8FA28A]" : ""}`} />
        </button>
      </div>
    </div>
  );
}
