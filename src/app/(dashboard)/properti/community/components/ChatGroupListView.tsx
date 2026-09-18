"use client";

import React, { useState, useMemo } from "react";
import {
  IconBuildingCommunity,
  IconSearch,
  IconUsers,
  IconClock,
  IconMessageDots,
  IconArrowRight,
  IconCheck,
  IconChecks,
} from "@tabler/icons-react";
import { AvailablePropertyOption, ChatCurrentUser } from "../types/chat";

interface ChatGroupListViewProps {
  properties: AvailablePropertyOption[];
  currentUser: ChatCurrentUser | null;
  loading: boolean;
  onSelectProperty: (propertyId: string) => void;
}

// Format relative/readable date for chat list
function formatChatListTime(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";

    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) return "Kemarin";

    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "";
  }
}

export function ChatGroupListView({
  properties,
  currentUser,
  loading,
  onSelectProperty,
}: ChatGroupListViewProps) {
  const [search, setSearch] = useState("");

  const filteredProperties = useMemo(() => {
    if (!search.trim()) return properties;
    const q = search.toLowerCase();
    return properties.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.city && p.city.toLowerCase().includes(q)) ||
        (p.address && p.address.toLowerCase().includes(q))
    );
  }, [properties, search]);

  const totalUnreadAll = useMemo(() => {
    return properties.reduce((acc, p) => acc + (p.unreadCount || 0), 0);
  }, [properties]);

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full bg-card rounded-3xl border border-border shadow-xs overflow-hidden animate-in fade-in duration-300">
      {/* 1. Header Banner */}
      <div className="p-5 sm:p-6 border-b border-border/80 bg-gradient-to-r from-muted/50 via-card to-muted/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-md">
              <IconBuildingCommunity className="h-6 w-6 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-foreground tracking-tight">
                  Komunitas & Obrolan Warga
                </h2>
                {totalUnreadAll > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold shadow-xs">
                    {totalUnreadAll} baru
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pilih grup kost untuk membuka percakapan, melihat pengumuman, dan berinteraksi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground self-start sm:self-auto bg-muted/60 px-3 py-1.5 rounded-xl border border-border/60">
            <span>
              {properties.length} {properties.length === 1 ? "Grup Kost" : "Grup Kost Tersedia"}
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mt-4">
          <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama kost, kota, atau alamat..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground font-medium"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* 2. Conversation / Group List (WhatsApp Mobile Style) */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/60 p-2 sm:p-3 space-y-1">
        {loading ? (
          <div className="p-8 text-center space-y-3">
            <div className="h-6 w-6 border-2 border-zinc-900 border-t-transparent dark:border-white dark:border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-muted-foreground">Memuat daftar komunitas kost...</p>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground mx-auto">
              <IconMessageDots className="h-6 w-6" />
            </div>
            <p className="text-xs font-bold text-foreground">
              {search ? "Kost tidak ditemukan" : "Belum ada grup komunitas"}
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {search
                ? `Tidak ada properti yang cocok dengan kata kunci "${search}".`
                : "Akun Anda belum terhubung dengan properti atau unit yang aktif."}
            </p>
          </div>
        ) : (
          filteredProperties.map((prop) => {
            const timeLabel = formatChatListTime(prop.lastMessageAt);
            const hasUnread = (prop.unreadCount || 0) > 0;

            return (
              <div
                key={prop.id}
                onClick={() => onSelectProperty(prop.id)}
                className="group flex items-center gap-3.5 p-3 sm:p-4 rounded-2xl hover:bg-muted/60 transition-all cursor-pointer border border-transparent hover:border-border/70 hover:shadow-xs"
              >
                {/* Avatar / Cover */}
                <div className="relative shrink-0">
                  {prop.coverImage ? (
                    <img
                      src={prop.coverImage}
                      alt={prop.name}
                      className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl object-cover border border-border shadow-xs group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-[#8FA28A] to-[#6E8269] text-white flex items-center justify-center font-black text-lg shadow-xs group-hover:scale-105 transition-transform duration-200">
                      {prop.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Online / Active Indicator */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-card" />
                </div>

                {/* Content Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                      {prop.name}
                    </h3>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0 font-medium">
                      {timeLabel}
                    </span>
                  </div>

                  {/* Last Message Snippet */}
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground truncate leading-relaxed">
                      {prop.lastMessage ? (
                        <>
                          {prop.lastSenderName && (
                            <span className="font-semibold text-foreground/80">
                              {prop.lastSenderName}:{" "}
                            </span>
                          )}
                          <span>{prop.lastMessage}</span>
                        </>
                      ) : (
                        <span className="italic text-muted-foreground/80">
                          Belum ada pesan obrolan. Ketuk untuk membuka grup.
                        </span>
                      )}
                    </p>

                    {/* Badges / Counters */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {hasUnread && (
                        <span className="min-w-5 h-5 px-1.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold flex items-center justify-center shadow-xs animate-in zoom-in-50">
                          {prop.unreadCount}
                        </span>
                      )}
                      <IconArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all hidden sm:block" />
                    </div>
                  </div>

                  {/* Property Meta Chips */}
                  <div className="flex items-center gap-2 mt-2">
                    {prop.city && (
                      <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-semibold text-muted-foreground">
                        📍 {prop.city}
                      </span>
                    )}
                    {(prop.activeTenantsCount ?? 0) > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                        👥 {prop.activeTenantsCount} Penghuni
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 3. Bottom Footer Helper */}
      <div className="p-3.5 border-t border-border/80 bg-muted/20 text-center">
        <p className="text-[11px] text-muted-foreground text-center">
          Setiap percakapan terisolasi aman untuk warga properti kos ini.
        </p>
      </div>
    </div>
  );
}
